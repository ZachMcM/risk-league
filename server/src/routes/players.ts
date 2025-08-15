import { InferInsertModel, sql } from "drizzle-orm";
import { Router } from "express";
import { leagueType, player, team } from "../db/schema";
import { apiKeyMiddleware } from "../middleware";
import { logger } from "../logger";
import { db } from "../db";
import { handleError } from "../utils/handleError";

export const playersRoute = Router();

function validatePlayerData(
  playerData: any
): playerData is InferInsertModel<typeof player> {
  const validLeagues = leagueType.enumValues;
  return (
    typeof playerData.playerId === "number" &&
    typeof playerData.name === "string" &&
    typeof playerData.teamId === "number" &&
    typeof playerData.position === "string" &&
    (typeof playerData.number === "number" || playerData.number === null) &&
    (typeof playerData.height === "string" || playerData.height === null) &&
    (typeof playerData.weight === "number" || playerData.weight === null) &&
    typeof playerData.league === "string" &&
    validLeagues.includes(playerData.league as any)
  );
}

playersRoute.post("/players", apiKeyMiddleware, async (req, res) => {
  try {
    const isBatch = Array.isArray(req.body.players);
    const playersToInsert: InferInsertModel<typeof player>[] = isBatch
      ? req.body.players
      : [req.body];

    if (playersToInsert.length === 0) {
      res.status(400).json({ error: "No players provided" });
      return;
    }

    const validPlayers = playersToInsert.filter((playerData, index) => {
      if (!validatePlayerData(playerData)) {
        logger.warn(`Invalid player data at index ${index}`, { playerData });
        return false;
      }
      return true;
    });

    if (validPlayers.length === 0) {
      res.status(304).json({ error: "No valid players provided" });
      return;
    }

    // Check which players have existing teams
    const playersWithValidTeams = [];
    let skippedCount = 0;

    for (const playerData of validPlayers) {
      try {
        const teamExists = await db
          .select({ teamId: team.teamId })
          .from(team)
          .where(sql`${team.teamId} = ${playerData.teamId} AND ${team.league} = ${playerData.league}`)
          .limit(1);

        if (teamExists.length > 0) {
          playersWithValidTeams.push(playerData);
        } else {
          logger.warn(`Skipping player ${playerData.name} - team ${playerData.teamId} not found in league ${playerData.league}`);
          skippedCount++;
        }
      } catch (error) {
        logger.warn(`Error checking team for player ${playerData.name}:`, error);
        skippedCount++;
      }
    }

    if (playersWithValidTeams.length === 0) {
      res.status(304).json({ 
        error: "No players with valid team references", 
        skipped: skippedCount 
      });
      return;
    }

    const result = await db
      .insert(player)
      .values(playersWithValidTeams)
      .onConflictDoUpdate({
        target: [player.playerId, player.league],
        set: {
          teamId: sql`EXCLUDED.team_id`,
          updatedAt: sql`EXCLUDED.updated_at`,
        },
      })
      .returning({ id: player.playerId });

    logger.info(`Successfully inserted ${result.length} player(s), skipped ${skippedCount} player(s) with missing team references`);

    res.json(isBatch ? result : result[0]);
  } catch (error) {
    handleError(error, res, "Player route");
  }
});
