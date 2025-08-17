import {
  and,
  desc,
  eq,
  InferSelectModel,
  or,
  sql
} from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../../db";
import {
  baseballPlayerStats,
  baseballTeamStats,
  game,
  leagueType,
  player
} from "../../db/schema";
import { logger } from "../../logger";
import { apiKeyMiddleware } from "../../middleware";
import { redis } from "../../redis";
import { handleError } from "../../utils/handleError";
import {
  baseballPlayerStatsBatchSchema,
  baseballTeamStatsBatchSchema
} from "../../validation/schemas";

// Create type-safe union of valid baseball stats (including extended stats)
type BaseballPlayerStatsRow = InferSelectModel<typeof baseballPlayerStats>;
type ValidBaseballStat =
  | keyof Omit<
      BaseballPlayerStatsRow,
      "id" | "gameId" | "playerId" | "league" | "status"
    >
  | "battingAvg"
  | "sluggingPct"
  | "obp"
  | "ops"
  | "hitsRunsRbis";

// List of valid numeric stats for runtime validation
const VALID_BASEBALL_STATS: ValidBaseballStat[] = [
  "errors",
  "hits",
  "runs",
  "singles",
  "doubles",
  "triples",
  "atBats",
  "walks",
  "caughtStealing",
  "homeRuns",
  "putouts",
  "stolenBases",
  "strikeouts",
  "hitByPitch",
  "intentionalWalks",
  "rbis",
  "outs",
  "hitsAllowed",
  "pitchingStrikeouts",
  "losses",
  "earnedRuns",
  "saves",
  "runsAllowed",
  "wins",
  "singlesAllowed",
  "doublesAllowed",
  "triplesAllowed",
  "pitchingWalks",
  "balks",
  "blownSaves",
  "pitchingCaughtStealing",
  "homeRunsAllowed",
  "inningsPitched",
  "pitchingPutouts",
  "stolenBasesAllowed",
  "wildPitches",
  "pitchingHitByPitch",
  "holds",
  "pitchingIntentionalWalks",
  "pitchesThrown",
  "strikes",
  // Extended stats
  "battingAvg",
  "sluggingPct",
  "obp",
  "ops",
  "hitsRunsRbis",
];

export const baseballRoute = Router();


baseballRoute.post(
  "/stats/baseball/teams",
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
        ? baseballTeamStatsBatchSchema.parse(rawData)
        : baseballTeamStatsBatchSchema.parse(rawData);

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
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues,
        });
        return;
      }
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
      const rawData = isBatch ? req.body.playerStats : [req.body];

      if (rawData.length === 0) {
        res.status(400).json({ error: "No player stat entries provided" });
        return;
      }

      // Zod validation
      const playerStatsToInsert = isBatch
        ? baseballPlayerStatsBatchSchema.parse(rawData)
        : baseballPlayerStatsBatchSchema.parse(rawData);

      const result = await db
        .insert(baseballPlayerStats)
        .values(playerStatsToInsert)
        .returning({ id: baseballPlayerStats.id });

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

      const extendedStats = playerStats.map(calculateExtendedPlayerStats);

      res.json(extendedStats);
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

      const extendedStats = await Promise.all(
        teamStats.map(
          async (stats) =>
            await calculateExtendedTeamStats(stats, teamId, league)
        )
      );

      res.json(extendedStats);
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
      ).map((row) => row);

      return await calculateExtendedTeamStats(stats, targetTeamId, league);
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

      // Validate stat exists at runtime
      if (!VALID_BASEBALL_STATS.includes(requestedStat)) {
        res.status(400).json({
          error: "Invalid stat parameter",
          validStats: VALID_BASEBALL_STATS,
        });
        return;
      }

      const minGames = parseInt(process.env.MIN_GAMES_FOR_CURRENT_SEASON_MLB!);
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

      if (statsList.length < minGames) {
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

      // Calculate extended stats for all entries
      const extendedStatsList = statsList.map(calculateExtendedPlayerStats);

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
      handleError(error, res, "Baseball averages route");
    }
  }
);

async function calculateExtendedTeamStats(
  teamStat: InferSelectModel<typeof baseballTeamStats>,
  teamId: number,
  league: (typeof leagueType.enumValues)[number]
) {
  const allPlayerStats = (
    await db
      .select()
      .from(baseballPlayerStats)
      .innerJoin(
        player,
        and(
          eq(baseballPlayerStats.playerId, player.playerId),
          eq(baseballPlayerStats.league, league)
        )
      )
      .where(
        and(
          eq(baseballPlayerStats.gameId, teamStat.gameId),
          eq(player.teamId, teamId),
          eq(baseballPlayerStats.league, league),
          eq(baseballPlayerStats.status, "ACT")
        )
      )
  ).map((row) => row.baseball_player_stats);

  const homeRunsAllowed = allPlayerStats.reduce(
    (accum, curr) => accum + curr.homeRunsAllowed,
    0
  );

  const pitchingStrikeouts = allPlayerStats.reduce(
    (accum, curr) => accum + curr.pitchingStrikeouts,
    0
  );

  const pitchingWalks = allPlayerStats.reduce(
    (accum, curr) => accum + curr.pitchingWalks,
    0
  );

  const doublesAllowed = allPlayerStats.reduce(
    (accum, curr) => accum + curr.doublesAllowed,
    0
  );

  const hitsAllowed = allPlayerStats.reduce(
    (accum, curr) => accum + curr.hitsAllowed,
    0
  );

  const triplesAllowed = allPlayerStats.reduce(
    (accum, curr) => accum + curr.triplesAllowed,
    0
  );

  const runsAllowed = allPlayerStats.reduce(
    (accum, curr) => accum + curr.runsAllowed,
    0
  );

  const strikes = allPlayerStats.reduce(
    (accum, curr) => accum + curr.strikes,
    0
  );

  const pitchesThrown = allPlayerStats.reduce(
    (accum, curr) => accum + curr.pitchesThrown,
    0
  );

  const battingAvg = teamStat.atBats > 0 ? teamStat.hits / teamStat.atBats : 0;

  const singles = allPlayerStats.reduce(
    (accum, curr) => accum + curr.singles,
    0
  );
  const sluggingPct = calculateSluggingPct(
    singles,
    teamStat.doubles,
    teamStat.triples,
    teamStat.homeRuns,
    teamStat.atBats
  );

  const hitByPitch = allPlayerStats.reduce(
    (accum, curr) => accum + curr.hitByPitch,
    0
  );
  const obp = calculateObp(
    teamStat.hits,
    hitByPitch,
    teamStat.atBats,
    teamStat.walks
  );

  const ops = sluggingPct + obp;

  const pitchingCaughtStealing = allPlayerStats.reduce(
    (accum, curr) => accum + curr.pitchingCaughtStealing,
    0
  );

  const stolenBasesAllowed = allPlayerStats.reduce(
    (accum, curr) => accum + curr.stolenBasesAllowed,
    0
  );

  const earnedRuns = allPlayerStats.reduce(
    (accum, curr) => accum + curr.earnedRuns,
    0
  );

  return {
    ...teamStat,
    homeRunsAllowed,
    pitchingStrikeouts,
    pitchingWalks,
    doublesAllowed,
    hitsAllowed,
    triplesAllowed,
    runsAllowed,
    strikes,
    pitchesThrown,
    battingAvg,
    sluggingPct,
    obp,
    ops,
    pitchingCaughtStealing,
    stolenBasesAllowed,
    earnedRuns,
  };
}

function calculateSluggingPct(
  singles: number,
  doubles: number,
  triples: number,
  home_runs: number,
  atBats: number
) {
  return atBats > 0
    ? (singles + 2 * doubles + 3 * triples + 4 * home_runs) / atBats
    : 0;
}

function calculateObp(
  hits: number,
  hitByPitch: number,
  atBats: number,
  walks: number
) {
  const denominator = atBats + walks + hitByPitch;
  return denominator > 0 ? (hits + walks + hitByPitch) / denominator : 0;
}

function calculateExtendedPlayerStats(
  stats: InferSelectModel<typeof baseballPlayerStats>
) {
  const sluggingPct = calculateSluggingPct(
    stats.singles,
    stats.doubles,
    stats.triples,
    stats.homeRuns,
    stats.atBats
  );
  const obp = calculateObp(
    stats.hits,
    stats.hitByPitch,
    stats.atBats,
    stats.walks
  );

  return {
    ...stats,
    battingAvg: stats.atBats > 0 ? stats.hits / stats.atBats : 0,
    sluggingPct,
    obp,
    ops: obp + sluggingPct,
    hitsRunsRbis: stats.hits + stats.runs + stats.rbis,
  };
}
