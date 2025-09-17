import { Router } from "express";
import { apiKeyMiddleware, authMiddleware } from "../middleware";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
import { pick, prop } from "../db/schema";
import { redis } from "../redis";
import { invalidateQueries } from "../utils/invalidateQueries";
import { handleError } from "../utils/handleError";
import { logger } from "../logger";

export const picksRoute = Router();

picksRoute.get("/picks/:id", authMiddleware, async (req, res) => {
  try {
    const pickId = parseInt(req.params.id);

    if (isNaN(pickId)) {
      res.status(400).json({ error: "Invalid id, could not parse" });
      return;
    }

    const pickResult = await db.query.pick.findFirst({
      where: eq(pick.id, pickId),
      with: {
        prop: {
          with: {
            player: {
              with: {
                team: true,
              },
            },
            game: {
              with: {
                homeTeam: true,
                awayTeam: true,
              },
            },
          },
        },
      },
    });

    res.json(pickResult);
  } catch (error) {
    handleError(error, res, "Picks");
  }
});