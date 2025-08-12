import { Router } from "express";
import { apiKeyMiddleware } from "../middleware";
import { logger } from "../logger";
import { InferInsertModel } from "drizzle-orm";
import { baseballPlayerStats, baseballTeamStats, leagueType } from "../db/schema";
import { db } from "../db";

export const baseballStatsRoute = Router();

function validateTeamStats(
  teamStats: any
): teamStats is InferInsertModel<typeof baseballTeamStats> {
  const validLeagues = leagueType.enumValues;
  return (
    typeof teamStats.gameId === "string" &&
    typeof teamStats.teamId === "number" &&
    typeof teamStats.league === "string" &&
    validLeagues.includes(teamStats.league as any) &&
    (typeof teamStats.errors === "number" || teamStats.errors === undefined) &&
    (typeof teamStats.hits === "number" || teamStats.hits === undefined) &&
    (typeof teamStats.runs === "number" || teamStats.runs === undefined) &&
    (typeof teamStats.doubles === "number" || teamStats.doubles === undefined) &&
    (typeof teamStats.triples === "number" || teamStats.triples === undefined) &&
    (typeof teamStats.atBats === "number" || teamStats.atBats === undefined) &&
    (typeof teamStats.walks === "number" || teamStats.walks === undefined) &&
    (typeof teamStats.caughtStealing === "number" || teamStats.caughtStealing === undefined) &&
    (typeof teamStats.homeRuns === "number" || teamStats.homeRuns === undefined) &&
    (typeof teamStats.stolenBases === "number" || teamStats.stolenBases === undefined) &&
    (typeof teamStats.strikeouts === "number" || teamStats.strikeouts === undefined) &&
    (typeof teamStats.rbis === "number" || teamStats.rbis === undefined)
  );
}

baseballStatsRoute.post(
  "/baseball-stats/teams",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const isBatch = Array.isArray(req.body.teamStats);
      const teamStatsToInsert: InferInsertModel<typeof baseballTeamStats>[] = isBatch
        ? req.body.teamStats
        : [req.body];

      if (teamStatsToInsert.length === 0) {
        res.status(400).json({ error: "No team stat entries provided" });
        return;
      }

      const invalidTeamStats = teamStatsToInsert.filter((teamStatsData, index) => {
        if (!validateTeamStats(teamStatsData)) {
          logger.warn(`Invalid team stats data at index ${index}`, { teamStatsData });
          return true;
        }
        return false;
      });

      if (invalidTeamStats.length > 0) {
        res.status(400).json({
        error: "Invalid team stats data provided",
          details: `${invalidTeamStats.length} team stats have invalid data.`,
        });
        return;
      }

      const result = await db
        .insert(baseballTeamStats)
        .values(teamStatsToInsert)
        .returning({ teamId: baseballTeamStats.teamId, gameId: baseballTeamStats.gameId });

      logger.info(`Successfully inserted ${result.length} team stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      logger.error("Baseball stats route error:", error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : "");
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }
);

function validatePlayerStats(
  playerStats: any
): playerStats is InferInsertModel<typeof baseballPlayerStats> {
  const validLeagues = leagueType.enumValues;
  return (
    typeof playerStats.gameId === "string" &&
    typeof playerStats.playerId === "number" &&
    typeof playerStats.league === "string" &&
    validLeagues.includes(playerStats.league as any) &&
    (typeof playerStats.errors === "number" || playerStats.errors === undefined) &&
    (typeof playerStats.hits === "number" || playerStats.hits === undefined) &&
    (typeof playerStats.runs === "number" || playerStats.runs === undefined) &&
    (typeof playerStats.singles === "number" || playerStats.singles === undefined) &&
    (typeof playerStats.doubles === "number" || playerStats.doubles === undefined) &&
    (typeof playerStats.triples === "number" || playerStats.triples === undefined) &&
    (typeof playerStats.atBats === "number" || playerStats.atBats === undefined) &&
    (typeof playerStats.walks === "number" || playerStats.walks === undefined) &&
    (typeof playerStats.caughtStealing === "number" ||
      playerStats.caughtStealing === undefined) &&
    (typeof playerStats.homeRuns === "number" || playerStats.homeRuns === undefined) &&
    (typeof playerStats.putouts === "number" || playerStats.putouts === undefined) &&
    (typeof playerStats.stolenBases === "number" ||
      playerStats.stolenBases === undefined) &&
    (typeof playerStats.strikeouts === "number" || playerStats.strikeouts === undefined) &&
    (typeof playerStats.hitByPitch === "number" || playerStats.hitByPitch === undefined) &&
    (typeof playerStats.intentionalWalks === "number" ||
      playerStats.intentionalWalks === undefined) &&
    (typeof playerStats.rbis === "number" || playerStats.rbis === undefined) &&
    (typeof playerStats.outs === "number" || playerStats.outs === undefined) &&
    (typeof playerStats.hitsAllowed === "number" ||
      playerStats.hitsAllowed === undefined) &&
    (typeof playerStats.pitchingStrikeouts === "number" ||
      playerStats.pitchingStrikeouts === undefined) &&
    (typeof playerStats.losses === "number" || playerStats.losses === undefined) &&
    (typeof playerStats.earnedRuns === "number" || playerStats.earnedRuns === undefined) &&
    (typeof playerStats.saves === "number" || playerStats.saves === undefined) &&
    (typeof playerStats.runsAllowed === "number" ||
      playerStats.runsAllowed === undefined) &&
    (typeof playerStats.wins === "number" || playerStats.wins === undefined) &&
    (typeof playerStats.singlesAllowed === "number" ||
      playerStats.singlesAllowed === undefined) &&
    (typeof playerStats.doublesAllowed === "number" ||
      playerStats.doublesAllowed === undefined) &&
    (typeof playerStats.triplesAllowed === "number" ||
      playerStats.triplesAllowed === undefined) &&
    (typeof playerStats.pitchingWalks === "number" ||
      playerStats.pitchingWalks === undefined) &&
    (typeof playerStats.balks === "number" || playerStats.balks === undefined) &&
    (typeof playerStats.blownSaves === "number" || playerStats.blownSaves === undefined) &&
    (typeof playerStats.pitchingCaughtStealing === "number" ||
      playerStats.pitchingCaughtStealing === undefined) &&
    (typeof playerStats.homeRunsAllowed === "number" ||
      playerStats.homeRunsAllowed === undefined) &&
    (typeof playerStats.inningsPitched === "number" ||
      playerStats.inningsPitched === undefined) &&
    (typeof playerStats.pitchingPutouts === "number" ||
      playerStats.pitchingPutouts === undefined) &&
    (typeof playerStats.stolenBasesAllowed === "number" ||
      playerStats.stolenBasesAllowed === undefined) &&
    (typeof playerStats.wildPitches === "number" ||
      playerStats.wildPitches === undefined) &&
    (typeof playerStats.pitchingHitByPitch === "number" ||
      playerStats.pitchingHitByPitch === undefined) &&
    (typeof playerStats.holds === "number" || playerStats.holds === undefined) &&
    (typeof playerStats.pitchingIntentionalWalks === "number" ||
      playerStats.pitchingIntentionalWalks === undefined) &&
    (typeof playerStats.pitchesThrown === "number" ||
      playerStats.pitchesThrown === undefined) &&
    (typeof playerStats.strikes === "number" || playerStats.strikes === undefined)
  );
}

baseballStatsRoute.post(
  "/baseball-stats/players",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const isBatch = Array.isArray(req.body.playerStats);
      const playerStatsToInsert: InferInsertModel<typeof baseballPlayerStats>[] = isBatch
        ? req.body.playerStats
        : [req.body];

      if (playerStatsToInsert.length === 0) {
        res.status(400).json({ error: "No player stat entries provided" });
        return;
      }

      const invalidPlayerStats = playerStatsToInsert.filter((playerStatsData, index) => {
        if (!validatePlayerStats(playerStatsData)) {
          logger.warn(`Invalid player stats data at index ${index}`, { playerStatsData });
          return true;
        }
        return false;
      });

      if (invalidPlayerStats.length > 0) {
        res.status(400).json({
          error: "Invalid player stats data provided",
          details: `${invalidPlayerStats.length} player stats have invalid data.`,
        });
        return;
      }

      const result = await db
        .insert(baseballPlayerStats)
        .values(playerStatsToInsert)
        .returning({ id: baseballPlayerStats.id });

      logger.info(`Successfully inserted ${result.length} player stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      logger.error("Baseball stats route error:", error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : "");
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }
);
