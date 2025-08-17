import {
  and,
  desc,
  eq,
  InferSelectModel,
  ne,
  or,
  sql
} from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
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
import {
  basketballPlayerStatsBatchSchema,
  basketballTeamStatsBatchSchema
} from "../../validation/schemas";

type BasketballPlayerStatsRow = InferSelectModel<typeof basketballPlayerStats>;
type ValidBasketballStat =
  | keyof Omit<
      BasketballPlayerStatsRow,
      "id" | "gameId" | "playerId" | "league" | "status"
    >
  | "trueShootingPct"
  | "usageRate"
  | "reboundsPct"
  | "assistsPct"
  | "blocksPct"
  | "stealsPct"
  | "threePct"
  | "pointsReboundsAssists"
  | "pointsRebounds"
  | "pointsAssists"
  | "reboundsAssists";

const VALID_BASKETBALL_STATS: ValidBasketballStat[] = [
  "fouls",
  "blocks",
  "points",
  "steals",
  "assists",
  "minutes",
  "turnovers",
  "rebounds",
  "twoPointsMade",
  "fieldGoalsMade",
  "freeThrowsMade",
  "threePointsMade",
  "defensiveRebounds",
  "offensiveRebounds",
  "twoPointPercentage",
  "twoPointsAttempted",
  "fieldGoalsAttempted",
  "freeThrowsAttempted",
  "threePointsAttempted",
  // Extended stats
  "trueShootingPct",
  "usageRate",
  "reboundsPct",
  "assistsPct",
  "blocksPct",
  "stealsPct",
  "threePct",
  "pointsReboundsAssists",
  "pointsRebounds",
  "pointsAssists",
  "reboundsAssists",
];

export const basketballRoute = Router();


basketballRoute.post(
  "/stats/basketball/teams",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const isBatch = Array.isArray(req.body.teamStats);
      const rawData = isBatch ? req.body.teamStats : [req.body];

      if (rawData.length === 0) {
        res.status(400).json({ error: "No team stat entries provided" });
        return;
      }

      const teamStatsToInsert = isBatch
        ? basketballTeamStatsBatchSchema.parse(rawData)
        : basketballTeamStatsBatchSchema.parse(rawData);

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
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues,
        });
        return;
      }
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
      const rawData = isBatch ? req.body.playerStats : [req.body];

      if (rawData.length === 0) {
        res.status(400).json({ error: "No player stat entries provided" });
        return;
      }

      // Zod validation
      const playerStatsToInsert = isBatch
        ? basketballPlayerStatsBatchSchema.parse(rawData)
        : basketballPlayerStatsBatchSchema.parse(rawData);

      const result = await db
        .insert(basketballPlayerStats)
        .values(playerStatsToInsert)
        .returning({ id: basketballPlayerStats.id });

      logger.info(`Successfully inserted ${result.length} player stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues,
        });
        return;
      }
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

      const extendedStats = await Promise.all(
        playerStats.map(
          async (stats) => await calculateExtendedPlayerStats(stats, league)
        )
      );

      res.json(extendedStats);
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

      const extendedStats = await Promise.all(
        teamStats.map(
          async (stats) =>
            await calculateExtendedTeamStats(stats, teamId, league)
        )
      );

      res.json(extendedStats);
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

      return await calculateExtendedTeamStats(stats, targetTeamId, league);
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

      if (!VALID_BASKETBALL_STATS.includes(requestedStat)) {
        res.status(400).json({
          error: "Invalid stat parameter",
          validStats: VALID_BASKETBALL_STATS,
        });
        return;
      }

      const minGamesEnvVar =
        league === "NBA"
          ? "MIN_GAMES_FOR_CURRENT_NBA_SEASON"
          : "MIN_GAMES_FOR_CURRENT_NCAABB_SEASON";

      const minGames = parseInt(process.env[minGamesEnvVar]!);

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
            // Add position filter only if position is specified
            ...(position ? [eq(player.position, position)] : [])
          )
        )
      ).map((row) => row.basketball_player_stats);

      if (statsList.length < minGames) {
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
              // Add position filter only if position is specified
              ...(position ? [eq(player.position, position)] : [])
            )
          )
        ).map((row) => row.basketball_player_stats);
      }

      if (statsList.length === 0) {
        res.status(404).json({ error: "No stats found for specified period" });
        return;
      }

      // Calculate extended stats for all entries
      const extendedStatsList = await Promise.all(
        statsList.map(
          async (stats) => await calculateExtendedPlayerStats(stats, league)
        )
      );

      // Calculate average for the requested stat (including extended stats)
      const totalStat = extendedStatsList.reduce((sum, stats) => {
        const statValue = (stats as any)[requestedStat];
        return sum + (typeof statValue === "number" ? statValue : 0);
      }, 0);
      const average = totalStat / extendedStatsList.length;

      const result = {
        stat: requestedStat,
        average: parseFloat(average.toFixed(4)),
        sampleSize: extendedStatsList.length,
        dataSource:
          extendedStatsList.length < minGames
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

async function calculateExtendedTeamStats(
  teamStat: InferSelectModel<typeof basketballTeamStats>,
  teamId: number,
  league: (typeof leagueType.enumValues)[number]
) {
  const oppStats = (await db.query.basketballTeamStats.findFirst({
    where: and(
      eq(basketballTeamStats.gameId, teamStat.gameId),
      ne(basketballTeamStats.teamId, teamStat.teamId),
      eq(basketballTeamStats.league, league)
    ),
  }))!;

  const allPlayerStats = (
    await db
      .select()
      .from(basketballPlayerStats)
      .innerJoin(
        player,
        and(
          eq(basketballPlayerStats.playerId, player.playerId),
          eq(basketballPlayerStats.league, league)
        )
      )
      .where(
        and(
          eq(basketballPlayerStats.gameId, teamStat.gameId),
          eq(basketballPlayerStats.league, league),
          eq(basketballPlayerStats.status, "ACT"),
          eq(player.teamId, teamId)
        )
      )
  ).map((row) => row.basketball_player_stats);

  const oppPossessions = estimatePossessions(
    oppStats.fieldGoalsAttempted,
    oppStats.freeThrowsAttempted,
    oppStats.turnovers,
    oppStats.offensiveRebounds
  );

  const teamMinutes = allPlayerStats.reduce(
    (accum, curr) => accum + curr.minutes,
    0
  );

  const possessions = estimatePossessions(
    teamStat.fieldGoalsAttempted,
    teamStat.freeThrowsAttempted,
    teamStat.turnovers,
    teamStat.offensiveRebounds
  );

  const pace = calculatePace(possessions, oppPossessions, teamMinutes);
  const offensiveRating = calculateOffensiveRating(teamStat.score, possessions);
  const defensiveRating = calculateDefensiveRating(
    oppStats.score,
    oppPossessions
  );

  return {
    ...teamStat,
    pace,
    offensiveRating,
    defensiveRating,
  };
}

// All stat calculations based on https://www.basketball-reference.com/about/glossary.html

function calculateTrueShootingPct(
  points: number,
  fieldGoalsAttempted: number,
  freeThrowsAttempted: number
) {
  const denominator = 2 * (fieldGoalsAttempted + 0.44 * freeThrowsAttempted);
  return denominator > 0 ? points / denominator : 0;
}

function calculateUsageRate(
  fieldGoalsAttempted: number,
  freeThrowsAttempted: number,
  turnovers: number,
  teamMinutes: number,
  minutes: number,
  teamFieldGoalsAttempted: number,
  teamFreeThrowsAttempted: number,
  teamTurnovers: number
) {
  const denominator =
    minutes *
    (teamFieldGoalsAttempted + 0.44 * teamFreeThrowsAttempted + teamTurnovers);
  return denominator > 0
    ? (100 *
        ((fieldGoalsAttempted + 0.44 * freeThrowsAttempted + turnovers) *
          (teamMinutes / 5))) /
        denominator
    : 0;
}

function calculateReboundsPct(
  rebounds: number,
  teamMinutes: number,
  minutes: number,
  teamRebounds: number,
  oppRebounds: number
) {
  const denominator = minutes * (teamRebounds + oppRebounds);
  return denominator > 0
    ? (100 * (rebounds * (teamMinutes / 5))) / denominator
    : 0;
}

function calculateAssistsPct(
  assists: number,
  minutes: number,
  teamMinutes: number,
  teamFieldGoalsMade: number,
  fieldGoalsMade: number
) {
  const denominator =
    (minutes / (teamMinutes / 5)) * teamFieldGoalsMade - fieldGoalsMade;
  return denominator > 0 ? (100 * assists) / denominator : 0;
}

function calculateBlocksPct(
  blocks: number,
  teamMinutes: number,
  minutes: number,
  oppFieldGoalsAttempted: number,
  oppThreePointsAttempted: number
) {
  const denominator =
    minutes * (oppFieldGoalsAttempted - oppThreePointsAttempted);
  return denominator > 0
    ? (100 * (blocks * (teamMinutes / 5))) / denominator
    : 0;
}

function estimatePossessions(
  teamFieldGoalsAttempted: number,
  teamFreeThrowsAttempted: number,
  teamTurnovers: number,
  teamOffensiveRebounds: number
) {
  return (
    teamFieldGoalsAttempted -
    teamOffensiveRebounds +
    teamTurnovers +
    0.44 * teamFreeThrowsAttempted
  );
}

function calculateStealsPct(
  steals: number,
  teamMinutes: number,
  minutes: number,
  oppPossessions: number
) {
  const denominator = minutes * oppPossessions;
  return denominator > 0
    ? (100 * (steals * (teamMinutes / 5))) / denominator
    : 0;
}

function calculatePace(
  possessions: number,
  oppPossessions: number,
  teamMinutes: number
) {
  const denominator = 2 * (teamMinutes / 5);
  return denominator > 0
    ? 48 * ((possessions + oppPossessions) / denominator)
    : 0;
}

function calculateOffensiveRating(teamPoints: number, possessions: number) {
  return possessions > 0 ? (100 * teamPoints) / possessions : 0;
}

function calculateDefensiveRating(oppPoints: number, oppPossessions: number) {
  return oppPossessions > 0 ? (100 * oppPoints) / oppPossessions : 0;
}

async function calculateExtendedPlayerStats(
  stats: InferSelectModel<typeof basketballPlayerStats>,
  league: (typeof leagueType.enumValues)[number]
) {
  const [team] = await db
    .select({ teamId: player.teamId })
    .from(player)
    .where(and(eq(player.playerId, stats.playerId), eq(player.league, league)));

  const teamStats = (await db.query.basketballTeamStats.findFirst({
    where: and(
      eq(basketballTeamStats.gameId, stats.gameId),
      eq(basketballTeamStats.teamId, team.teamId),
      eq(basketballTeamStats.league, league)
    ),
  }))!;

  const allPlayerStats = (
    await db
      .select()
      .from(basketballPlayerStats)
      .innerJoin(
        player,
        and(
          eq(basketballPlayerStats.playerId, player.playerId),
          eq(basketballPlayerStats.league, league)
        )
      )
      .where(
        and(
          eq(basketballPlayerStats.gameId, stats.gameId),
          eq(player.teamId, team.teamId),
          eq(basketballPlayerStats.league, league),
          eq(basketballPlayerStats.status, "ACT")
        )
      )
  ).map((row) => row.basketball_player_stats);

  const oppStats = (await db.query.basketballTeamStats.findFirst({
    where: and(
      eq(basketballTeamStats.gameId, stats.gameId),
      ne(basketballTeamStats.teamId, team.teamId),
      eq(basketballTeamStats.league, league)
    ),
  }))!;

  const teamMinutes = allPlayerStats.reduce(
    (accum, curr) => accum + curr.minutes,
    0
  );

  const trueShootingPct = calculateTrueShootingPct(
    stats.points,
    stats.fieldGoalsAttempted,
    stats.freeThrowsAttempted
  );

  const usageRate = calculateUsageRate(
    stats.fieldGoalsAttempted,
    stats.freeThrowsAttempted,
    stats.turnovers,
    teamMinutes,
    stats.minutes,
    teamStats.fieldGoalsAttempted,
    teamStats.freeThrowsAttempted,
    teamStats.turnovers
  );

  const reboundsPct = calculateReboundsPct(
    stats.rebounds,
    teamMinutes,
    stats.minutes,
    teamStats.rebounds,
    oppStats.rebounds
  );

  const assistsPct = calculateAssistsPct(
    stats.assists,
    stats.minutes,
    teamMinutes,
    teamStats.fieldGoalsMade,
    stats.fieldGoalsMade
  );

  const blocksPct = calculateBlocksPct(
    stats.blocks,
    teamMinutes,
    stats.minutes,
    oppStats.fieldGoalsAttempted,
    oppStats.threePointsAttempted
  );

  const oppPossessions = estimatePossessions(
    oppStats.fieldGoalsAttempted,
    oppStats.freeThrowsAttempted,
    oppStats.turnovers,
    oppStats.offensiveRebounds
  );

  const stealsPct = calculateStealsPct(
    stats.steals,
    teamMinutes,
    stats.minutes,
    oppPossessions
  );

  return {
    ...stats,
    trueShootingPct,
    usageRate,
    reboundsPct,
    assistsPct,
    blocksPct,
    stealsPct,
    threePct:
      stats.threePointsAttempted > 0
        ? stats.threePointsMade / stats.threePointsAttempted
        : 0,
    pointsReboundsAssists: stats.points + stats.rebounds + stats.assists,
    pointsRebounds: stats.points + stats.rebounds,
    pointsAssists: stats.points + stats.assists,
    reboundsAssists: stats.rebounds + stats.assists,
  };
}
