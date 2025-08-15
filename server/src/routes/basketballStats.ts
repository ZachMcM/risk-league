import { Router } from "express";
import { apiKeyMiddleware } from "../middleware";
import { logger } from "../logger";
import { and, desc, eq, InferInsertModel } from "drizzle-orm";
import {
  basketballPlayerStats,
  basketballTeamStats,
  game,
  leagueType,
  player,
} from "../db/schema";
import { db } from "../db";
import { handleError } from "../utils/handleError";
import { point } from "drizzle-orm/pg-core";

export const basketballStatsRoute = Router();

function validateTeamStats(
  teamStats: any
): teamStats is InferInsertModel<typeof basketballTeamStats> {
  const validLeagues = leagueType.enumValues;
  return (
    typeof teamStats.gameId === "string" &&
    typeof teamStats.teamId === "number" &&
    typeof teamStats.league === "string" &&
    validLeagues.includes(teamStats.league as any) &&
    (typeof teamStats.score === "number" || teamStats.score === undefined) &&
    (typeof teamStats.fouls === "number" || teamStats.fouls === undefined) &&
    (typeof teamStats.blocks === "number" || teamStats.blocks === undefined) &&
    (typeof teamStats.steals === "number" || teamStats.steals === undefined) &&
    (typeof teamStats.assists === "number" ||
      teamStats.assists === undefined) &&
    (typeof teamStats.turnovers === "number" ||
      teamStats.turnovers === undefined) &&
    (typeof teamStats.rebounds === "number" ||
      teamStats.rebounds === undefined) &&
    (typeof teamStats.twoPointsMade === "number" ||
      teamStats.twoPointsMade === undefined) &&
    (typeof teamStats.fieldGoalsMade === "number" ||
      teamStats.fieldGoalsMade === undefined) &&
    (typeof teamStats.freeThrowsMade === "number" ||
      teamStats.freeThrowsMade === undefined) &&
    (typeof teamStats.threePointsMade === "number" ||
      teamStats.threePointsMade === undefined) &&
    (typeof teamStats.defensiveRebounds === "number" ||
      teamStats.defensiveRebounds === undefined) &&
    (typeof teamStats.offensiveRebounds === "number" ||
      teamStats.offensiveRebounds === undefined) &&
    (typeof teamStats.twoPointPercentage === "number" ||
      teamStats.twoPointPercentage === undefined) &&
    (typeof teamStats.twoPointsAttempted === "number" ||
      teamStats.twoPointsAttempted === undefined) &&
    (typeof teamStats.fieldGoalsAttempted === "number" ||
      teamStats.fieldGoalsAttempted === undefined) &&
    (typeof teamStats.freeThrowsAttempted === "number" ||
      teamStats.freeThrowsAttempted === undefined) &&
    (typeof teamStats.threePointsAttempted === "number" ||
      teamStats.threePointsAttempted === undefined)
  );
}

basketballStatsRoute.post(
  "/basketball-stats/teams",
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

      const invalidTeamStats = teamStatsToInsert.filter(
        (teamStatsData, index) => {
          if (!validateTeamStats(teamStatsData)) {
            logger.warn(`Invalid team stats data at index ${index}`, {
              teamStatsData,
            });
            return true;
          }
          return false;
        }
      );

      if (invalidTeamStats.length > 0) {
        res.status(400).json({
          error: "Invalid team stats data provided",
          details: `${invalidTeamStats.length} team stats have invalid data.`,
        });
        return;
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

function validatePlayerStats(
  playerStats: any
): playerStats is InferInsertModel<typeof basketballPlayerStats> {
  const validLeagues = leagueType.enumValues;
  return (
    typeof playerStats.gameId === "string" &&
    typeof playerStats.playerId === "number" &&
    typeof playerStats.league === "string" &&
    validLeagues.includes(playerStats.league as any) &&
    (typeof playerStats.fouls === "number" ||
      playerStats.fouls === undefined) &&
    (typeof playerStats.blocks === "number" ||
      playerStats.blocks === undefined) &&
    (typeof playerStats.points === "number" ||
      playerStats.points === undefined) &&
    (typeof playerStats.steals === "number" ||
      playerStats.steals === undefined) &&
    (typeof playerStats.assists === "number" ||
      playerStats.assists === undefined) &&
    (typeof playerStats.minutes === "number" ||
      playerStats.minutes === undefined) &&
    (typeof playerStats.turnovers === "number" ||
      playerStats.turnovers === undefined) &&
    (typeof playerStats.rebounds === "number" ||
      playerStats.rebounds === undefined) &&
    (typeof playerStats.twoPointsMade === "number" ||
      playerStats.twoPointsMade === undefined) &&
    (typeof playerStats.fieldGoalsMade === "number" ||
      playerStats.fieldGoalsMade === undefined) &&
    (typeof playerStats.freeThrowsMade === "number" ||
      playerStats.freeThrowsMade === undefined) &&
    (typeof playerStats.threePointsMade === "number" ||
      playerStats.threePointsMade === undefined) &&
    (typeof playerStats.defensiveRebounds === "number" ||
      playerStats.defensiveRebounds === undefined) &&
    (typeof playerStats.offensiveRebounds === "number" ||
      playerStats.offensiveRebounds === undefined) &&
    (typeof playerStats.twoPointPercentage === "number" ||
      playerStats.twoPointPercentage === undefined) &&
    (typeof playerStats.twoPointsAttempted === "number" ||
      playerStats.twoPointsAttempted === undefined) &&
    (typeof playerStats.fieldGoalsAttempted === "number" ||
      playerStats.fieldGoalsAttempted === undefined) &&
    (typeof playerStats.freeThrowsAttempted === "number" ||
      playerStats.freeThrowsAttempted === undefined) &&
    (typeof playerStats.threePointsAttempted === "number" ||
      playerStats.threePointsAttempted === undefined)
  );
}

basketballStatsRoute.post(
  "/basketball-stats/players",
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

      const invalidPlayerStats = playerStatsToInsert.filter(
        (playerStatsData, index) => {
          if (!validatePlayerStats(playerStatsData)) {
            logger.warn(`Invalid player stats data at index ${index}`, {
              playerStatsData,
            });
            return true;
          }
          return false;
        }
      );

      if (invalidPlayerStats.length > 0) {
        res.status(400).json({
          error: "Invalid player stats data provided",
          details: `${invalidPlayerStats.length} player stats have invalid data.`,
        });
        return;
      }

      const result = await db
        .insert(basketballPlayerStats)
        .values(playerStatsToInsert)
        .returning({ id: basketballPlayerStats.id });

      logger.info(`Successfully inserted ${result.length} player stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      handleError(error, res, "Basketball stats route");
    }
  }
);

basketballStatsRoute.get(
  "/basketball-stats/players/:playerId",
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
      const league = req.query.league as
        | undefined
        | (typeof leagueType.enumValues)[0];

      if (
        league === undefined ||
        !["NCAABB", "NBA"].includes(league) ||
        isNaN(playerId) ||
        isNaN(limit) ||
        limit <= 0
      ) {
        res.status(400).json({ error: "Invalid playerId or limit parameter" });
        return;
      }

      const playerStats = (
        await db
          .select()
          .from(basketballPlayerStats)
          .innerJoin(game, eq(basketballPlayerStats.gameId, game.gameId))
          .where(
            and(
              eq(basketballPlayerStats.playerId, playerId),
              eq(basketballPlayerStats.league, league)
            )
          )
          .orderBy(desc(game.startTime))
          .limit(limit)
      ).map((row) => row.basketball_player_stats);

      const [team] = await db
        .select({ teamId: player.teamId })
        .from(player)
        .where(and(eq(player.playerId, playerId), eq(player.league, league)));

      const extendedStats = playerStats.map(async (stats) => {
        const teamStats = await db.query.basketballTeamStats.findFirst({
          where: and(
            eq(basketballTeamStats.gameId, stats.gameId),
            eq(basketballTeamStats.teamId, team.teamId)
          ),
        });
      });

      res.json(extendedStats)
    } catch (error) {
      handleError(error, res, "Baseball stats route");
    }
  }
);

// All stat calculations based on https://www.basketball-reference.com/about/glossary.html

function calculateTrueShootingPct(
  points: number,
  fieldGoalsAttempted: number,
  freeThrowsAttempted: number
) {
  return points / (2 * (fieldGoalsAttempted + 0.44 * freeThrowsAttempted));
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
  return (
    (100 *
      ((fieldGoalsAttempted + 0.44 * freeThrowsAttempted + turnovers) *
        (teamMinutes / 5))) /
    (minutes *
      (teamFieldGoalsAttempted +
        0.44 * teamFreeThrowsAttempted +
        teamTurnovers))
  );
}

function calculateReboundsPct(
  rebounds: number,
  teamMinutes: number,
  minutes: number,
  teamRebounds: number,
  oppRebounds: number
) {
  return (
    (100 * (rebounds * (teamMinutes / 5))) /
    (minutes * (teamRebounds + oppRebounds))
  );
}

function calculateBlocksPct(
  blocks: number,
  teamMinutes: number,
  minutes: number,
  oppFieldGoalsAttempted: number,
  oppThreePointsAttempted: number
) {
  return (
    (100 * (blocks * (teamMinutes / 5))) /
    (minutes * (oppFieldGoalsAttempted - oppThreePointsAttempted))
  );
}

function estimatePossessions(teamFieldGoalsAttempted: number, teamFreeThrowsAttempted: number, teamTurnovers: number, teamOffensiveRebounds: number) {
  return teamFieldGoalsAttempted - teamOffensiveRebounds + teamTurnovers + 0.44 * teamFreeThrowsAttempted
}

function calculateStealsPct(steals: number, teamMinutes: number, minutes: number, oppPossessions: number) {
  return (100 * (steals * (teamMinutes / 5))) / (minutes * oppPossessions);
}

function calculatePace(possessions: number, oppPossessions: number, teamMinutes: number) {
  return 48 * ((possessions + oppPossessions) / (2 * (teamMinutes / 5)));
}

function calculateOffensiveRating(teamPoints: number, possessions: number) {
  return (100 * teamPoints) / possessions
}

function calculateDefensiveRating(oppPoints: number, oppPossessions: number) {
  return (100 * oppPoints) / oppPossessions
}