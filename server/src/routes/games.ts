import { Router } from "express";
import { apiKeyMiddleware, authMiddleware } from "../middleware";
import { logger } from "../logger";
import { db } from "../db";
import { game, leagueType } from "../db/schema";
import { and, eq, gte, InferInsertModel, sql, lt } from "drizzle-orm";
import { handleError } from "../utils/handleError";
import { createInsertSchema } from "drizzle-zod";
import moment from "moment";

export const gamesRoute = Router();

const gamesSchema = createInsertSchema(game);

gamesRoute.get(
  "/games/league/:league/today",
  authMiddleware,
  async (req, res) => {
    try {
      const league = req.params.league as (typeof leagueType.enumValues)[number] | undefined;

      if (
        league === undefined ||
        !leagueType.enumValues.includes(league as any)
      ) {
        res.status(400).json({
          error: "League or playerId parameter is invalid",
        });
        return;
      }

      const startOfDay = moment()
        .subtract(1, "day")
        .startOf("day")
        .toISOString();
      const endOfDay = moment().endOf("day").toISOString();

      const todayGames = await db.query.game.findMany({
        where: and(
          eq(game.league, league),
          gte(game.startTime, startOfDay),
          lt(game.startTime, endOfDay),
        ),
        with: {
          homeTeam: true,
          awayTeam: true
        }
      })

      res.json(todayGames)
    } catch (error) {
      handleError(error, res, "Games");
    }
  }
);

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
    handleError(error, res, "Games route");
  }
});
