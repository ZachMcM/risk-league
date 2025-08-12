import { Router } from "express";
import { apiKeyMiddleware } from "../middleware";
import { logger } from "../logger";
import { InferInsertModel } from "drizzle-orm";
import {
  basketballPlayerStats,
  basketballTeamStats,
  leagueType,
} from "../db/schema";
import { db } from "../db";

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
      logger.error("Basketball stats route error:", error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : "");
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
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
      logger.error("Basketball stats route error:", error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : "");
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }
);
