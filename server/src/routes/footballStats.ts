import { Router } from "express";
import { apiKeyMiddleware } from "../middleware";
import { logger } from "../logger";
import { InferInsertModel } from "drizzle-orm";
import {
  footballPlayerStats,
  footballTeamStats,
  leagueType,
} from "../db/schema";
import { db } from "../db";

export const footballStatsRoute = Router();

function validateTeamStats(
  teamStats: any
): teamStats is InferInsertModel<typeof footballTeamStats> {
  const validLeagues = leagueType.enumValues;
  return (
    typeof teamStats.gameId === "string" &&
    typeof teamStats.teamId === "number" &&
    typeof teamStats.league === "string" &&
    validLeagues.includes(teamStats.league as any) &&
    (typeof teamStats.score === "number" || teamStats.score === undefined) &&
    (typeof teamStats.sacks === "number" || teamStats.sacks === undefined) &&
    (typeof teamStats.safeties === "number" ||
      teamStats.safeties === undefined) &&
    (typeof teamStats.penaltiesTotal === "number" ||
      teamStats.penaltiesTotal === undefined) &&
    (typeof teamStats.penaltiesYards === "number" ||
      teamStats.penaltiesYards === undefined) &&
    (typeof teamStats.turnovers === "number" ||
      teamStats.turnovers === undefined) &&
    (typeof teamStats.firstDowns === "number" ||
      teamStats.firstDowns === undefined) &&
    (typeof teamStats.totalYards === "number" ||
      teamStats.totalYards === undefined) &&
    (typeof teamStats.blockedKicks === "number" ||
      teamStats.blockedKicks === undefined) &&
    (typeof teamStats.blockedPunts === "number" ||
      teamStats.blockedPunts === undefined) &&
    (typeof teamStats.kicksBlocked === "number" ||
      teamStats.kicksBlocked === undefined) &&
    (typeof teamStats.passingYards === "number" ||
      teamStats.passingYards === undefined) &&
    (typeof teamStats.puntsBlocked === "number" ||
      teamStats.puntsBlocked === undefined) &&
    (typeof teamStats.rushingYards === "number" ||
      teamStats.rushingYards === undefined) &&
    (typeof teamStats.defenseTouchdowns === "number" ||
      teamStats.defenseTouchdowns === undefined) &&
    (typeof teamStats.defenseInterceptions === "number" ||
      teamStats.defenseInterceptions === undefined) &&
    (typeof teamStats.kickReturnTouchdowns === "number" ||
      teamStats.kickReturnTouchdowns === undefined) &&
    (typeof teamStats.puntReturnTouchdowns === "number" ||
      teamStats.puntReturnTouchdowns === undefined) &&
    (typeof teamStats.blockedKickTouchdowns === "number" ||
      teamStats.blockedKickTouchdowns === undefined) &&
    (typeof teamStats.blockedPuntTouchdowns === "number" ||
      teamStats.blockedPuntTouchdowns === undefined) &&
    (typeof teamStats.interceptionTouchdowns === "number" ||
      teamStats.interceptionTouchdowns === undefined) &&
    (typeof teamStats.fumbleReturnTouchdowns === "number" ||
      teamStats.fumbleReturnTouchdowns === undefined) &&
    (typeof teamStats.defenseFumbleRecoveries === "number" ||
      teamStats.defenseFumbleRecoveries === undefined) &&
    (typeof teamStats.fieldGoalReturnTouchdowns === "number" ||
      teamStats.fieldGoalReturnTouchdowns === undefined) &&
    (typeof teamStats.twoPointConversionReturns === "number" ||
      teamStats.twoPointConversionReturns === undefined) &&
    (typeof teamStats.twoPointConversionAttempts === "number" ||
      teamStats.twoPointConversionAttempts === undefined) &&
    (typeof teamStats.twoPointConversionSucceeded === "number" ||
      teamStats.twoPointConversionSucceeded === undefined) &&
    (typeof teamStats.pointsAgainstDefenseSpecialTeams === "number" ||
      teamStats.pointsAgainstDefenseSpecialTeams === undefined) &&
    (typeof teamStats.passingTouchdowns === "number" ||
      teamStats.passingTouchdowns === undefined) &&
    (typeof teamStats.rushingTouchdowns === "number" ||
      teamStats.rushingTouchdowns === undefined) &&
    (typeof teamStats.specialTeamsTouchdowns === "number" ||
      teamStats.specialTeamsTouchdowns === undefined) &&
    (typeof teamStats.totalPassingYardsAllowed === "number" ||
      teamStats.totalPassingYardsAllowed === undefined) &&
    (typeof teamStats.totalRushingYardsAllowed === "number" ||
      teamStats.totalRushingYardsAllowed === undefined) &&
    (typeof teamStats.offenseTouchdowns === "number" ||
      teamStats.offenseTouchdowns === undefined)
  );
}

footballStatsRoute.post(
  "/football-stats/teams",
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
        .insert(footballTeamStats)
        .values(teamStatsToInsert)
        .returning({
          teamId: footballTeamStats.teamId,
          gameId: footballTeamStats.gameId,
        });

      logger.info(`Successfully inserted ${result.length} team stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      logger.error(
        "Football stats route error:",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : ""
      );
      res.status(500).json({ error });
    }
  }
);

function validatePlayerStats(
  playerStats: any
): playerStats is InferInsertModel<typeof footballPlayerStats> {
  const validLeagues = leagueType.enumValues;
  return (
    typeof playerStats.gameId === "string" &&
    typeof playerStats.playerId === "number" &&
    typeof playerStats.league === "string" &&
    validLeagues.includes(playerStats.league as any) &&
    (typeof playerStats.completions === "number" ||
      playerStats.completions === undefined) &&
    (typeof playerStats.fumblesLost === "number" ||
      playerStats.fumblesLost === undefined) &&
    (typeof playerStats.rushingLong === "number" ||
      playerStats.rushingLong === undefined) &&
    (typeof playerStats.passerRating === "number" ||
      playerStats.passerRating === undefined) &&
    (typeof playerStats.passingYards === "number" ||
      playerStats.passingYards === undefined) &&
    (typeof playerStats.rushingYards === "number" ||
      playerStats.rushingYards === undefined) &&
    (typeof playerStats.passingAttempts === "number" ||
      playerStats.passingAttempts === undefined) &&
    (typeof playerStats.rushingAttempts === "number" ||
      playerStats.rushingAttempts === undefined) &&
    (typeof playerStats.passingTouchdowns === "number" ||
      playerStats.passingTouchdowns === undefined) &&
    (typeof playerStats.rushingTouchdowns === "number" ||
      playerStats.rushingTouchdowns === undefined) &&
    (typeof playerStats.passingInterceptions === "number" ||
      playerStats.passingInterceptions === undefined) &&
    (typeof playerStats.receivingYards === "number" ||
      playerStats.receivingYards === undefined) &&
    (typeof playerStats.receivingTouchdowns === "number" ||
      playerStats.receivingTouchdowns === undefined) &&
    (typeof playerStats.receivingLong === "number" ||
      playerStats.receivingLong === undefined) &&
    (typeof playerStats.receptions === "number" ||
      playerStats.receptions === undefined)
  );
}

footballStatsRoute.post(
  "/football-stats/players",
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
        .insert(footballPlayerStats)
        .values(playerStatsToInsert)
        .returning({ id: footballPlayerStats.id });

      logger.info(`Successfully inserted ${result.length} player stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      logger.error(
        "Football stats route error:",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : ""
      );
      res.status(500).json({ error });
    }
  }
);
