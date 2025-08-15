import { Router } from "express";
import { apiKeyMiddleware } from "../middleware";
import { logger } from "../logger";
import { db } from "../db";
import { game, leagueType } from "../db/schema";
import { InferInsertModel } from "drizzle-orm";
import { handleError } from "../utils/handleError";

export const gamesRoute = Router();

function validateGameData(
  gameData: any,
): gameData is InferInsertModel<typeof game> {
  const validLeagues = leagueType.enumValues;
  return (
    typeof gameData.gameId === "string" &&
    typeof gameData.startTime === "string" &&
    typeof gameData.homeTeamId === "number" &&
    typeof gameData.awayTeamId === "number" &&
    typeof gameData.league === "string" &&
    validLeagues.includes(gameData.league as any)
  );
}

gamesRoute.post("/games", apiKeyMiddleware, async (req, res) => {
  try {
    const isBatch = Array.isArray(req.body.games);
    const gamesToInsert: InferInsertModel<typeof game>[] = isBatch
      ? req.body.games
      : [req.body];

    if (gamesToInsert.length === 0) {
      res.status(400).json({ error: "No games provided" });
      return;
    }

    const invalidGames = gamesToInsert.filter((gameData, index) => {
      if (!validateGameData(gameData)) {
        logger.warn(`Invalid game data at index ${index}`, { gameData });
        return true;
      }
      return false;
    });

    if (invalidGames.length > 0) {
      res.status(400).json({
        error: "Invalid game data provided",
        details: `${invalidGames.length} game(s) have invalid data.`,
      });
      return;
    }

    const result = await db
      .insert(game)
      .values(gamesToInsert)
      .returning({ id: game.gameId });

    logger.info(`Successfully inserted ${result.length} game(s)`);

    res.json(isBatch ? result : result[0]);
  } catch (error) {
    logger.error("Error inserting games:", error);

    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        res.status(409).json({ error: "One or more games already exist" });
        return;
      }
      if (error.message.includes("foreign key")) {
        res.status(400).json({ error: "Invalid team ID provided" });
        return;
      }
    }

    handleError(error, res, "Games route");
  }
});
