import { Router } from "express";
import { apiKeyMiddleware } from "../middleware";
import { logger } from "../logger";
import { db } from "../db";
import { game, leagueType } from "../db/schema";
import { InferInsertModel, sql } from "drizzle-orm";
import { handleError } from "../utils/handleError";
import { createInsertSchema } from "drizzle-zod";

export const gamesRoute = Router();

const gamesSchema = createInsertSchema(game);

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

    for (const entry of gamesToInsert) {
      gamesSchema.parse(entry);
    }

    const result = await db
      .insert(game)
      .values(gamesToInsert)
      .onConflictDoUpdate({
        target: [game.gameId, game.league],
        set: {
          gameId: sql`EXCLUDED.game_id`,
        },
      })
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
