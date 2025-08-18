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
  footballPlayerStats,
  footballTeamStats,
  game,
  leagueType,
  player,
} from "../../db/schema";
import { logger } from "../../logger";
import { apiKeyMiddleware } from "../../middleware";
import { redis } from "../../redis";
import { handleError } from "../../utils/handleError";
import { createInsertSchema } from "drizzle-zod";
import { MIN_GAMES_FOR_CURRENT_FOOTBALL_SEASON } from "../../config";

// Create type-safe union of valid football stats
type FootballPlayerStatsRow = InferSelectModel<typeof footballPlayerStats>;
type ValidFootballStat =
  | keyof Omit<
      FootballPlayerStatsRow,
      "id" | "gameId" | "playerId" | "league" | "status"
    >;

export const footballRoute = Router();
const footballTeamStatsSchema = createInsertSchema(footballTeamStats);
const footballPlayerStatsSchema = createInsertSchema(footballPlayerStats);

footballRoute.post(
  "/stats/football/teams",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const isBatch = Array.isArray(req.body.teamStats);
      const teamStatsToInsert: InferInsertModel<typeof footballTeamStats>[] =
        isBatch ? req.body.teamStats : [req.body];

      if (teamStatsToInsert.length === 0) {
        res.status(400).json({ error: "No team stat entries provided" });
        return;
      }

      for (const entry of teamStatsToInsert) {
        footballTeamStatsSchema.parse(entry);
      }

      const result = await db
        .insert(footballTeamStats)
        .values(teamStatsToInsert)
        .returning({
          teamId: footballTeamStats.teamId,
          gameId: footballTeamStats.gameId,
        });

      logger.info(`Successfully inserted ${result.length} team stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      handleError(error, res, "Football stats route");
    }
  }
);

footballRoute.post(
  "/stats/football/players",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const isBatch = Array.isArray(req.body.playerStats);
      const playerStatsToInsert: InferInsertModel<
        typeof footballPlayerStats
      >[] = isBatch ? req.body.playerStats : [req.body];

      if (playerStatsToInsert.length === 0) {
        res.status(400).json({ error: "No player stat entries provided" });
        return;
      }

      for (const entry of playerStatsToInsert) {
        footballPlayerStatsSchema.parse(entry);
      }

      const result = await db
        .insert(footballPlayerStats)
        .values(playerStatsToInsert)
        .returning({ id: footballPlayerStats.id });

      logger.info(`Successfully inserted ${result.length} player stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      handleError(error, res, "Football stats route");
    }
  }
);

footballRoute.get(
  "/stats/football/league/:league/players/:playerId",
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
        !["NFL", "NCAAFB"].includes(league) ||
        isNaN(playerId) ||
        isNaN(limit) ||
        limit <= 0
      ) {
        res
          .status(400)
          .json({ error: "Invalid league, playerId or limit parameter" });
        return;
      }

      const playerStats = (
        await db
          .select()
          .from(footballPlayerStats)
          .innerJoin(
            game,
            and(
              eq(footballPlayerStats.gameId, game.gameId),
              eq(footballPlayerStats.league, league),
              eq(footballPlayerStats.status, "ACT")
            )
          )
          .where(
            and(
              eq(footballPlayerStats.playerId, playerId),
              eq(footballPlayerStats.league, league),
              eq(footballPlayerStats.status, "ACT")
            )
          )
          .orderBy(desc(game.startTime))
          .limit(limit)
      ).map((row) => row.football_player_stats);

      res.json(playerStats);
    } catch (error) {
      handleError(error, res, "Football stats");
    }
  }
);

footballRoute.get(
  "/stats/football/league/:league/teams/:teamId",
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
        !["NFL", "NCAAFB"].includes(league) ||
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
          .from(footballTeamStats)
          .innerJoin(
            game,
            and(
              eq(footballTeamStats.gameId, game.gameId),
              eq(footballTeamStats.league, league)
            )
          )
          .where(
            and(
              eq(footballTeamStats.teamId, teamId),
              eq(footballTeamStats.league, league)
            )
          )
          .orderBy(desc(game.startTime))
          .limit(limit)
      ).map((row) => row.football_team_stats);

      res.json(teamStats);
    } catch (error) {
      handleError(error, res, "Football stats route");
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
      playerTeamId: footballPlayerStats.teamId,
    })
    .from(game)
    .innerJoin(
      footballPlayerStats,
      and(eq(game.gameId, footballPlayerStats.gameId), eq(game.league, league))
    )
    .where(
      and(
        eq(footballPlayerStats.playerId, playerId),
        eq(footballPlayerStats.league, league),
        eq(footballPlayerStats.status, "ACT")
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
          .from(footballTeamStats)
          .where(
            and(
              eq(footballTeamStats.gameId, gameInfo.gameId),
              eq(footballTeamStats.teamId, targetTeamId),
              eq(footballTeamStats.league, league)
            )
          )
      ).map((row) => row);

      return stats;
    })
  );
}

footballRoute.get(
  "/stats/football/league/:league/players/:playerId/team-stats",
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
        !["NCAAFB", "NFL"].includes(league) ||
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
      handleError(error, res, "Football team stats route");
    }
  }
);

footballRoute.get(
  "/stats/football/league/:league/players/:playerId/team-stats/opponents",
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
        !["NCAAFB", "NFL"].includes(league) ||
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
      handleError(error, res, "Football opponent stats route");
    }
  }
);

footballRoute.get(
  "/stats/football/league/:league/averages/:stat",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const league = req.params
        .league as (typeof leagueType.enumValues)[number];
      const requestedStat = req.params.stat as ValidFootballStat;

      if (!leagueType.enumValues.includes(league)) {
        res.status(400).json({ error: "Invalid league parameter" });
        return;
      }

      if (!["NFL", "NCAAFB"].includes(league)) {
        res
          .status(400)
          .json({ error: "Invalid league parameter for football" });
        return;
      }

      // Football seasons span calendar years (Aug/Sep to Jan/Feb)
      // Current season year is based on when season started
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentSeasonYear =
        now.getMonth() >= 7 ? currentYear : currentYear - 1; // Season starts in August

      const position = req.query.position as string | undefined;

      // Position is optional - if undefined, pull from all positions
      if (position && !["QB", "WR", "TE", "RB", "K", "PK"].includes(position)) {
        res.status(400).json("Invalid position");
        return;
      }

      const cacheKey = position
        ? `football:averages:${league}:${requestedStat}:${position}:${currentSeasonYear}`
        : `football:averages:${league}:${requestedStat}:all:${currentSeasonYear}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }

      let query = db
        .select()
        .from(footballPlayerStats)
        .innerJoin(
          game,
          and(
            eq(footballPlayerStats.gameId, game.gameId),
            eq(footballPlayerStats.league, league)
          )
        );

      // Only join player table if position filter is needed
      if (position) {
        query = query.innerJoin(
          player,
          and(
            eq(footballPlayerStats.playerId, player.playerId),
            eq(footballPlayerStats.league, league)
          )
        );
      }

      let statsList = (
        await query.where(
          and(
            eq(footballPlayerStats.league, league),
            eq(footballPlayerStats.status, "ACT"),
            or(
              sql`EXTRACT(YEAR FROM ${game.startTime}) = ${currentSeasonYear}`,
              sql`EXTRACT(YEAR FROM ${game.startTime}) = ${
                currentSeasonYear + 1
              }`
            ),
            // Add position filter only if position is specified
            ...(position
              ? [
                  ["PK", "K"].includes(position)
                    ? inArray(player.position, ["PK", "K"])
                    : eq(player.position, position),
                ]
              : [])
          )
        )
      ).map((row) => row.football_player_stats);

      if (statsList.length < MIN_GAMES_FOR_CURRENT_FOOTBALL_SEASON) {
        const previousSeasonYear = currentSeasonYear - 1;

        let fallbackQuery = db
          .select()
          .from(footballPlayerStats)
          .innerJoin(
            game,
            and(
              eq(footballPlayerStats.gameId, game.gameId),
              eq(footballPlayerStats.league, league)
            )
          );

        // Only join player table if position filter is needed
        if (position) {
          fallbackQuery = fallbackQuery.innerJoin(
            player,
            and(
              eq(footballPlayerStats.playerId, player.playerId),
              eq(footballPlayerStats.league, league)
            )
          );
        }

        statsList = (
          await fallbackQuery.where(
            and(
              eq(footballPlayerStats.league, league),
              eq(footballPlayerStats.status, "ACT"),
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
              // Add position filter only if position is specified
              ...(position
                ? [
                    ["PK", "K"].includes(position)
                      ? inArray(player.position, ["PK", "K"])
                      : eq(player.position, position),
                  ]
                : [])
            )
          )
        ).map((row) => row.football_player_stats);
      }

      if (statsList.length === 0) {
        res.status(404).json({ error: "No stats found for specified period" });
        return;
      }

      const extendedStatsList = statsList.map((stats) => ({
        ...stats,
        receivingRushingTouchdowns:
          stats.receivingTouchdowns + stats.rushingTouchdowns,
        passingRushingTouchdowns:
          stats.passingTouchdowns + stats.rushingTouchdowns,
      }));

      // Calculate average for the requested stat
      const totalStat = extendedStatsList.reduce(
        (sum, stats) => sum + ((stats[requestedStat] as number) || 0),
        0
      );
      const average = totalStat / extendedStatsList.length;

      const result = {
        stat: requestedStat,
        average: parseFloat(average.toFixed(4)),
        sampleSize: extendedStatsList.length,
        dataSource:
          extendedStatsList.length < MIN_GAMES_FOR_CURRENT_FOOTBALL_SEASON
            ? "current + previous season"
            : "current season",
      };

      await redis.setEx(cacheKey, 3600, JSON.stringify(result));

      res.json(result);
    } catch (error) {
      handleError(error, res, "Football averages route");
    }
  }
);
