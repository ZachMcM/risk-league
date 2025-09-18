import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { pick } from "../db/schema";
import { authMiddleware } from "../middleware";
import { handleError } from "../utils/handleError";

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