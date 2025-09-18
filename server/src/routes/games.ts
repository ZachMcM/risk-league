import { and, eq, gt, gte, lt } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { Router } from "express";
import moment from "moment";
import { db } from "../db";
import { game, leagueType } from "../db/schema";
import { authMiddleware } from "../middleware";
import { handleError } from "../utils/handleError";

export const gamesRoute = Router();

const gamesSchema = createInsertSchema(game);

gamesRoute.get(
  "/games/league/:league/today",
  authMiddleware,
  async (req, res) => {
    try {
      const league = req.params.league as
        | (typeof leagueType.enumValues)[number]
        | undefined;

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
          gt(game.startTime, new Date().toISOString()),
          lt(game.startTime, endOfDay)
        ),
        with: {
          homeTeam: true,
          awayTeam: true,
        },
      });

      res.json(todayGames);
    } catch (error) {
      handleError(error, res, "Games");
    }
  }
);
