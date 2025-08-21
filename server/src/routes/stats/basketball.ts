import {
  and,
  desc,
  eq,
  inArray,
  InferInsertModel,
  InferSelectModel,
  or,
  sql,
} from "drizzle-orm";
import { Router } from "express";
import { db } from "../../db";
import {
  basketballPlayerStats,
  basketballTeamStats,
  game,
  leagueType,
  player,
} from "../../db/schema";
import { logger } from "../../logger";
import { apiKeyMiddleware } from "../../middleware";
import { redis } from "../../redis";
import { handleError } from "../../utils/handleError";
import { createInsertSchema } from "drizzle-zod";
import { MIN_GAMES_FOR_CURRENT_BASKETBALL_SEASON } from "../../config";

type BasketballPlayerStatsRow = InferSelectModel<typeof basketballPlayerStats>;
type ValidBasketballStat =
  | keyof Omit<
      BasketballPlayerStatsRow,
      "id" | "gameId" | "playerId" | "league" | "status"
    >;

export const basketballRoute = Router();
const basketballPlayerStatsSchema = createInsertSchema(basketballPlayerStats);
const basketballTeamStatsSchema = createInsertSchema(basketballTeamStats);

basketballRoute.post(
  "/stats/basketball/teams",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const isBatch = Array.isArray(req.body.teamStats);
      const teamStatsToInsert: InferInsertModel<typeof basketballTeamStats>[] =
        isBatch ? req.body.teamStats : [req.body];

      if (teamStatsToInsert.length === 0) {
        res.status(400).json({ error: "No team stat entries provided" });
        return;
      }

      for (const entry of teamStatsToInsert) {
        basketballTeamStatsSchema.parse(entry);
      }

      const result = await db
        .insert(basketballTeamStats)
        .values(teamStatsToInsert)
        .returning({
          teamId: basketballTeamStats.teamId,
          gameId: basketballTeamStats.gameId,
        });

      logger.info(`Successfully inserted ${result.length} team stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      handleError(error, res, "Basketball stats route");
    }
  }
);

basketballRoute.post(
  "/stats/basketball/players",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const isBatch = Array.isArray(req.body.playerStats);
      const playerStatsToInsert: InferInsertModel<
        typeof basketballPlayerStats
      >[] = isBatch ? req.body.playerStats : [req.body];

      if (playerStatsToInsert.length === 0) {
        res.status(400).json({ error: "No player stat entries provided" });
        return;
      }

      for (const entry of playerStatsToInsert) {
        basketballPlayerStatsSchema.parse(entry);
      }

      // Filter out players that don't exist in the database
      const playerIds = [...new Set(playerStatsToInsert.map(entry => entry.playerId))];
      const league = playerStatsToInsert[0].league;
      
      const existingPlayers = await db
        .select({ playerId: player.playerId })
        .from(player)
        .where(
          and(
            inArray(player.playerId, playerIds),
            eq(player.league, league)
          )
        );

      const existingPlayerIds = new Set(existingPlayers.map(p => p.playerId));
      const validEntries = playerStatsToInsert.filter(entry => 
        existingPlayerIds.has(entry.playerId)
      );

      if (validEntries.length === 0) {
        res.status(400).json({ error: "No valid player entries found - all players missing from database" });
        return;
      }

      if (validEntries.length !== playerStatsToInsert.length) {
        const missingPlayerIds = playerStatsToInsert
          .filter(entry => !existingPlayerIds.has(entry.playerId))
          .map(entry => entry.playerId);
        logger.warn(`Players not found in database, skipping: ${missingPlayerIds.join(', ')}`);
      }

      const result = await db
        .insert(basketballPlayerStats)
        .values(validEntries)
        .returning({ id: basketballPlayerStats.id });

      logger.info(`Successfully inserted ${result.length} player stat entries (${playerStatsToInsert.length - validEntries.length} skipped)`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      handleError(error, res, "Basketball stats route");
    }
  }
);

basketballRoute.get(
  "/stats/basketball/league/:league/players/:playerId",
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
        | undefined
        | (typeof leagueType.enumValues)[0];

      if (
        league === undefined ||
        !["NCAABB", "NBA"].includes(league) ||
        isNaN(playerId) ||
        isNaN(limit) ||
        limit <= 0
      ) {
        res
          .status(400)
          .json({ error: "Invalid leauge, playerId or limit parameter" });
        return;
      }

      const playerStats = (
        await db
          .select()
          .from(basketballPlayerStats)
          .innerJoin(
            game,
            and(
              eq(basketballPlayerStats.gameId, game.gameId),
              eq(basketballPlayerStats.league, league)
            )
          )
          .where(
            and(
              eq(basketballPlayerStats.playerId, playerId),
              eq(basketballPlayerStats.league, league),
              eq(basketballPlayerStats.status, "ACT")
            )
          )
          .orderBy(desc(game.startTime))
          .limit(limit)
      ).map((row) => row.basketball_player_stats);

      res.json(playerStats);
    } catch (error) {
      handleError(error, res, "Basketball stats route");
    }
  }
);

basketballRoute.get(
  "/stats/basketball/league/:league/teams/:teamId",
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
        !["NBA", "NCAABB"].includes(league) ||
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
          .from(basketballTeamStats)
          .innerJoin(
            game,
            and(
              eq(basketballTeamStats.gameId, game.gameId),
              eq(basketballTeamStats.league, league)
            )
          )
          .where(
            and(
              eq(basketballTeamStats.teamId, teamId),
              eq(basketballTeamStats.league, league)
            )
          )
          .orderBy(desc(game.startTime))
          .limit(limit)
      ).map((row) => row.basketball_team_stats);

      res.json(teamStats);
    } catch (error) {
      handleError(error, res, "Basketball stats route");
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
      playerTeamId: basketballPlayerStats.teamId,
    })
    .from(game)
    .innerJoin(
      basketballPlayerStats,
      and(
        eq(game.gameId, basketballPlayerStats.gameId),
        eq(game.league, league)
      )
    )
    .where(
      and(
        eq(basketballPlayerStats.playerId, playerId),
        eq(basketballPlayerStats.league, league),
        eq(basketballPlayerStats.status, "ACT")
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
          .from(basketballTeamStats)
          .where(
            and(
              eq(basketballTeamStats.gameId, gameInfo.gameId),
              eq(basketballTeamStats.teamId, targetTeamId),
              eq(basketballTeamStats.league, league)
            )
          )
      ).map((row) => row);

      return stats;
    })
  );
}

basketballRoute.get(
  "/stats/basketball/league/:league/players/:playerId/team-stats",
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
        !["NCAABB", "NBA"].includes(league) ||
        isNaN(playerId) ||
        isNaN(limit) ||
        limit <= 0
      ) {
        res
          .status(400)
          .json({ error: "Invalid league, playerId or limit parameter" });
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
      handleError(error, res, "Basketball team stats route");
    }
  }
);

basketballRoute.get(
  "/stats/basketball/league/:league/players/:playerId/team-stats/opponents",
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
        !["NCAABB", "NBA"].includes(league) ||
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
      handleError(error, res, "Basketball opponent stats route");
    }
  }
);

basketballRoute.get(
  "/stats/basketball/league/:league/averages/:stat",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const league = req.params
        .league as (typeof leagueType.enumValues)[number];
      const requestedStat = req.params.stat as ValidBasketballStat;

      if (!leagueType.enumValues.includes(league)) {
        res.status(400).json({ error: "Invalid league parameter" });
        return;
      }

      if (!["NBA", "NCAABB"].includes(league)) {
        res
          .status(400)
          .json({ error: "Invalid league parameter for basketball" });
        return;
      }

      // Basketball seasons span calendar years (Oct/Nov to Apr/May)
      // Current season year is based on when season started
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentSeasonYear =
        now.getMonth() >= 9 ? currentYear : currentYear - 1; // Season starts in October

      const position = req.query.position as string | undefined;

      const cacheKey = position
        ? `basketball:averages:${league}:${requestedStat}:${position}:${currentSeasonYear}`
        : `basketball:averages:${league}:${requestedStat}:all:${currentSeasonYear}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }

      let query = db
        .select()
        .from(basketballPlayerStats)
        .innerJoin(
          game,
          and(
            eq(basketballPlayerStats.gameId, game.gameId),
            eq(basketballPlayerStats.league, league)
          )
        );

      // Only join player table if position filter is needed
      if (position) {
        query = query.innerJoin(
          player,
          and(
            eq(basketballPlayerStats.playerId, player.playerId),
            eq(basketballPlayerStats.league, league)
          )
        );
      }

      let statsList = (
        await query.where(
          and(
            eq(basketballPlayerStats.league, league),
            eq(basketballPlayerStats.status, "ACT"),
            or(
              sql`EXTRACT(YEAR FROM ${game.startTime}) = ${currentSeasonYear}`,
              sql`EXTRACT(YEAR FROM ${game.startTime}) = ${
                currentSeasonYear + 1
              }`
            ),
            ...(position
              ? [
                  inArray(
                    player.position,
                    position == "G"
                      ? ["G", "PG", "SG", "GF"]
                      : position == "F"
                      ? ["GF", "F", "SF", "PF", "FC"]
                      : ["FC", "C"]
                  ),
                ]
              : [])
          )
        )
      ).map((row) => row.basketball_player_stats);

      if (statsList.length < MIN_GAMES_FOR_CURRENT_BASKETBALL_SEASON) {
        const previousSeasonYear = currentSeasonYear - 1;

        let fallbackQuery = db
          .select()
          .from(basketballPlayerStats)
          .innerJoin(
            game,
            and(
              eq(basketballPlayerStats.gameId, game.gameId),
              eq(basketballPlayerStats.league, league)
            )
          );

        // Only join player table if position filter is needed
        if (position) {
          fallbackQuery = fallbackQuery.innerJoin(
            player,
            and(
              eq(basketballPlayerStats.playerId, player.playerId),
              eq(basketballPlayerStats.league, league)
            )
          );
        }

        statsList = (
          await fallbackQuery.where(
            and(
              eq(basketballPlayerStats.league, league),
              eq(basketballPlayerStats.status, "ACT"),
              or(
                // Current season (spans 2 calendar years)
                sql`EXTRACT(YEAR FROM ${game.startTime}) = ${currentSeasonYear}`,
                sql`EXTRACT(YEAR FROM ${game.startTime}) = ${
                  currentSeasonYear + 1
                }`,
                // Previous season (spans 2 calendar years)
                sql`EXTRACT(YEAR FROM ${game.startTime}) = ${previousSeasonYear}`,
                sql`EXTRACT(YEAR FROM ${game.startTime}) = ${
                  previousSeasonYear + 1
                }`
              ),
              ...(position
                ? [
                    inArray(
                      player.position,
                      position == "G"
                        ? ["G", "PG", "SG", "GF"]
                        : position == "F"
                        ? ["GF", "F", "SF", "PF", "FC"]
                        : ["FC", "C"]
                    ),
                  ]
                : [])
            )
          )
        ).map((row) => row.basketball_player_stats);
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
          statsList.length < MIN_GAMES_FOR_CURRENT_BASKETBALL_SEASON
            ? "current + previous season"
            : "current season",
      };

      await redis.setEx(cacheKey, 3600, JSON.stringify(result));

      res.json(result);
    } catch (error) {
      handleError(error, res, "Basketball averages route");
    }
  }
);
