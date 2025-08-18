import {
  and,
  desc,
  eq,
  InferInsertModel,
  InferSelectModel,
  or,
  sql,
} from "drizzle-orm";
import { Router } from "express";
import { db } from "../../db";
import {
  baseballPlayerStats,
  baseballTeamStats,
  game,
  leagueType,
} from "../../db/schema";
import { logger } from "../../logger";
import { apiKeyMiddleware } from "../../middleware";
import { redis } from "../../redis";
import { handleError } from "../../utils/handleError";
import { createInsertSchema } from "drizzle-zod";
import { MIN_GAMES_FOR_CURRENT_MLB_SEASON } from "../../config";

// Create type-safe union of valid baseball stats (including extended stats)
type BaseballPlayerStatsRow = InferSelectModel<typeof baseballPlayerStats>;
type ValidBaseballStat =
  | keyof Omit<
      BaseballPlayerStatsRow,
      "id" | "gameId" | "playerId" | "league" | "status"
    >

export const baseballRoute = Router();

const baseballTeamStatsSchema = createInsertSchema(baseballTeamStats);
const baseballPlayerStatsSchema = createInsertSchema(baseballPlayerStats);

baseballRoute.post(
  "/stats/baseball/teams",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const isBatch = Array.isArray(req.body.teamStats);
      const teamStatsToInsert: InferInsertModel<typeof baseballTeamStats>[] =
        isBatch ? req.body.teamStats : [req.body];

      if (teamStatsToInsert.length === 0) {
        res.status(400).json({ error: "No team stat entries provided" });
        return;
      }

      for (const entry of teamStatsToInsert) {
        baseballTeamStatsSchema.parse(entry);
      }

      const result = await db
        .insert(baseballTeamStats)
        .values(teamStatsToInsert)
        .returning({
          teamId: baseballTeamStats.teamId,
          gameId: baseballTeamStats.gameId,
        });

      logger.info(`Successfully inserted ${result.length} team stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      handleError(error, res, "Baseball stats route");
    }
  }
);

baseballRoute.post(
  "/stats/baseball/players",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const isBatch = Array.isArray(req.body.playerStats);
      const playerStatsToInsert: InferInsertModel<
        typeof baseballPlayerStats
      >[] = isBatch ? req.body.playerStats : [req.body];

      if (playerStatsToInsert.length === 0) {
        res.status(400).json({ error: "No player stat entries provided" });
        return;
      }

      for (const entry of playerStatsToInsert) {
        baseballPlayerStatsSchema.parse(entry);
      }

      const result = await db
        .insert(baseballPlayerStats)
        .values(playerStatsToInsert)
        .returning({ id: baseballPlayerStats.id });

      logger.info(`Successfully inserted ${result.length} player stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      handleError(error, res, "Baseball stats route");
    }
  }
);

baseballRoute.get(
  "/stats/baseball/league/:league/players/:playerId",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const limitStr = req.query.limit as string | undefined;

      if (!limitStr) {
        res.status(400).json({ error: "Invalid query string, missing limit" });
        return;
      }

      const playerId = parseInt(req.params.playerId);
      const limit = parseInt(limitStr);
      const league = req.params.league as
        | (typeof leagueType.enumValues)[number]
        | undefined;

      if (
        league === undefined ||
        !["MLB"].includes(league) ||
        isNaN(playerId) ||
        isNaN(limit) ||
        limit <= 0
      ) {
        res
          .status(400)
          .json({ error: "Invalid playerId, league, or limit parameter" });
        return;
      }

      const playerStats = (
        await db
          .select()
          .from(baseballPlayerStats)
          .innerJoin(game, eq(baseballPlayerStats.gameId, game.gameId))
          .where(
            and(
              eq(baseballPlayerStats.playerId, playerId),
              eq(baseballPlayerStats.league, league),
              eq(baseballPlayerStats.status, "ACT")
            )
          )
          .orderBy(desc(game.startTime))
          .limit(limit)
      ).map((row) => row.baseball_player_stats);

      res.json(playerStats);
    } catch (error) {
      handleError(error, res, "Baseball stats route");
    }
  }
);

baseballRoute.get(
  "/stats/baseball/league/:league/teams/:teamId",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const limitStr = req.query.limit as string | undefined;

      if (!limitStr) {
        res.status(400).json({ error: "Invalid query string, missing limit" });
        return;
      }

      const teamId = parseInt(req.params.teamId);
      const league = req.params.league as
        | (typeof leagueType.enumValues)[number]
        | undefined;
      const limit = parseInt(limitStr);

      if (
        league === undefined ||
        !["MLB"].includes(league) ||
        isNaN(teamId) ||
        isNaN(limit) ||
        limit <= 0
      ) {
        res
          .status(400)
          .json({ error: "Invalid league, teamId, or limit parameter" });
        return;
      }

      const teamStats = (
        await db
          .select()
          .from(baseballTeamStats)
          .innerJoin(
            game,
            and(
              eq(baseballTeamStats.gameId, game.gameId),
              eq(baseballTeamStats.league, league)
            )
          )
          .where(
            and(
              eq(baseballTeamStats.teamId, teamId),
              eq(baseballTeamStats.league, league)
            )
          )
          .orderBy(desc(game.startTime))
          .limit(limit)
      ).map((row) => row.baseball_team_stats);

      res.json(teamStats);
    } catch (error) {
      handleError(error, res, "Baseball stats route");
    }
  }
);

async function getPlayerTeamStats(
  playerId: number,
  league: (typeof leagueType.enumValues)[number],
  limit: number,
  isOpponent: boolean = false
) {
  const gamesResult = await db
    .select({
      gameId: game.gameId,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      playerTeamId: baseballPlayerStats.teamId,
    })
    .from(game)
    .innerJoin(
      baseballPlayerStats,
      and(eq(game.gameId, baseballPlayerStats.gameId), eq(game.league, league))
    )
    .where(
      and(
        eq(baseballPlayerStats.playerId, playerId),
        eq(baseballPlayerStats.league, league),
        eq(baseballPlayerStats.status, "ACT")
      )
    )
    .orderBy(desc(game.startTime))
    .limit(limit);

  if (gamesResult.length === 0) {
    throw new Error("Invalid playerId and league, no player stats found");
  }

  return await Promise.all(
    gamesResult.map(async (gameInfo) => {
      const targetTeamId = isOpponent
        ? gameInfo.homeTeamId === gameInfo.playerTeamId
          ? gameInfo.awayTeamId
          : gameInfo.homeTeamId
        : gameInfo.playerTeamId;

      const [stats] = (
        await db
          .select()
          .from(baseballTeamStats)
          .where(
            and(
              eq(baseballTeamStats.gameId, gameInfo.gameId),
              eq(baseballTeamStats.teamId, targetTeamId),
              eq(baseballTeamStats.league, league)
            )
          )
      );

      return stats;
    })
  );
}

baseballRoute.get(
  "/stats/baseball/league/:league/players/:playerId/team-stats",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const limitStr = req.query.limit as string | undefined;

      if (!limitStr) {
        res.status(400).json({ error: "Invalid query string, missing limit" });
        return;
      }

      const playerId = parseInt(req.params.playerId);
      const league = req.params
        .league as (typeof leagueType.enumValues)[number];
      const limit = parseInt(limitStr);

      if (
        league === undefined ||
        !["MLB"].includes(league) ||
        isNaN(playerId) ||
        isNaN(limit) ||
        limit <= 0
      ) {
        res
          .status(400)
          .json({ error: "Invalid league, playerId, or limit parameter" });
        return;
      }

      const teamStats = await getPlayerTeamStats(
        playerId,
        league,
        limit,
        false
      );
      res.json(teamStats);
    } catch (error) {
      handleError(error, res, "Baseball player team stats route");
    }
  }
);

baseballRoute.get(
  "/stats/baseball/league/:league/players/:playerId/team-stats/opponents",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const limitStr = req.query.limit as string | undefined;

      if (!limitStr) {
        res.status(400).json({ error: "Invalid query string, missing limit" });
        return;
      }

      const playerId = parseInt(req.params.playerId);
      const league = req.params
        .league as (typeof leagueType.enumValues)[number];
      const limit = parseInt(limitStr);

      if (
        league === undefined ||
        !["MLB"].includes(league) ||
        isNaN(playerId) ||
        isNaN(limit) ||
        limit <= 0
      ) {
        res
          .status(400)
          .json({ error: "Invalid league, playerId or limit parameter" });
        return;
      }

      const opponentStats = await getPlayerTeamStats(
        playerId,
        league,
        limit,
        true
      );
      res.json(opponentStats);
    } catch (error) {
      handleError(error, res, "Baseball player opponent stats route");
    }
  }
);

baseballRoute.get(
  "/stats/baseball/league/:league/averages/:stat",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const league = req.params
        .league as (typeof leagueType.enumValues)[number];
      const requestedStat = req.params.stat as ValidBaseballStat;

      if (!leagueType.enumValues.includes(league)) {
        res.status(400).json({ error: "Invalid league parameter" });
        return;
      }
;
      const currentYear = new Date().getFullYear();

      const cacheKey = `baseball:averages:${league}:${requestedStat}:${currentYear}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }

      let statsList = (
        await db
          .select()
          .from(baseballPlayerStats)
          .innerJoin(
            game,
            and(
              eq(baseballPlayerStats.gameId, game.gameId),
              eq(baseballPlayerStats.league, league)
            )
          )
          .where(
            and(
              eq(baseballPlayerStats.league, league),
              eq(baseballPlayerStats.status, "ACT"),
              sql`EXTRACT(YEAR FROM ${game.startTime}) = ${currentYear}`
            )
          )
      ).map((row) => row.baseball_player_stats);

      if (statsList.length < MIN_GAMES_FOR_CURRENT_MLB_SEASON) {
        const pastYear = currentYear - 1;

        statsList = (
          await db
            .select()
            .from(baseballPlayerStats)
            .innerJoin(
              game,
              and(
                eq(baseballPlayerStats.gameId, game.gameId),
                eq(baseballPlayerStats.league, league)
              )
            )
            .where(
              and(
                eq(baseballPlayerStats.league, league),
                eq(baseballPlayerStats.status, "ACT"),
                or(
                  sql`EXTRACT(YEAR FROM ${game.startTime}) = ${currentYear}`,
                  sql`EXTRACT(YEAR FROM ${game.startTime}) = ${pastYear}`
                )
              )
            )
        ).map((row) => row.baseball_player_stats);
      }

      if (statsList.length === 0) {
        res.status(404).json({ error: "No stats found for specified period" });
        return;
      }

      // Calculate average for the requested stat (including extended stats)
      const totalStat = statsList.reduce((sum, stats) => {
        const statValue = (stats as any)[requestedStat];
        return sum + (typeof statValue === "number" ? statValue : 0);
      }, 0);
      const average = totalStat / statsList.length;

      const result = {
        stat: requestedStat,
        average: parseFloat(average.toFixed(4)),
        sampleSize: statsList.length,
        dataSource:
          statsList.length < MIN_GAMES_FOR_CURRENT_MLB_SEASON
            ? "current + previous season"
            : "current season",
      };

      await redis.setEx(cacheKey, 3600, JSON.stringify(result));

      res.json(result);
    } catch (error) {
      handleError(error, res, "Baseball averages route");
    }
  }
);
