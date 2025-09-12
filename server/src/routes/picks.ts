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

picksRoute.patch("/picks", apiKeyMiddleware, async (req, res) => {
  try {
    const propId = req.query.propId;

    if (!propId || isNaN(parseInt(propId as string))) {
      logger.error("Invalid propId query string");
      res.status(400).json({ error: "Invalid propId query string" });
      return;
    }

    const updatedProp = await db.query.prop.findFirst({
      where: eq(prop.id, parseInt(propId as string)),
    });

    if (!updatedProp) {
      logger.error(`No prop found with propId ${propId}`);
      res.status(400).json({ error: `No prop found with propId ${propId}` });
      return;
    }

    const picksToInvalidateList: { id: number; parlayId: number }[] = [];

    if (updatedProp.status == "did_not_play") {
      const didNotPlayPicks = await db
        .update(pick)
        .set({
          status: "did_not_play",
        })
        .where(eq(pick.propId, updatedProp.id))
        .returning({ id: pick.id, parlayId: pick.parlayId });

      picksToInvalidateList.push(...didNotPlayPicks);
    } else if (updatedProp.status == "resolved") {
      if (updatedProp.currentValue > updatedProp.line) {
        const hits = await db
          .update(pick)
          .set({
            status: "hit",
          })
          .where(and(eq(pick.choice, "over"), eq(pick.propId, updatedProp.id)))
          .returning({ id: pick.id, parlayId: pick.parlayId });

        picksToInvalidateList.push(...hits);

        const misses = await db
          .update(pick)
          .set({
            status: "missed",
          })
          .where(and(eq(pick.choice, "under"), eq(pick.propId, updatedProp.id)))
          .returning({ id: pick.id, parlayId: pick.parlayId });

        picksToInvalidateList.push(...misses);
      } else if (updatedProp.currentValue == updatedProp.line) {
        const ties = await db
          .update(pick)
          .set({
            status: "tie",
          })
          .where(eq(pick.propId, updatedProp.id))
          .returning({ id: pick.id, parlayId: pick.parlayId });

        picksToInvalidateList.push(...ties);
      } else {
        const misses = await db
          .update(pick)
          .set({
            status: "missed",
          })
          .where(and(eq(pick.choice, "over"), eq(pick.propId, updatedProp.id)))
          .returning({ id: pick.id, parlayId: pick.parlayId });

        picksToInvalidateList.push(...misses);

        const hits = await db
          .update(pick)
          .set({
            status: "hit",
          })
          .where(and(eq(pick.choice, "under"), eq(pick.propId, updatedProp.id)))
          .returning({ id: pick.id, parlayId: pick.parlayId });

        picksToInvalidateList.push(...hits);
      }
    } else {
      if (updatedProp.currentValue > updatedProp.line) {
        const hits = await db
          .update(pick)
          .set({
            status: "hit",
          })
          .where(and(eq(pick.choice, "over"), eq(pick.propId, updatedProp.id)))
          .returning({ id: pick.id, parlayId: pick.parlayId });

        picksToInvalidateList.push(...hits);

        const misses = await db
          .update(pick)
          .set({
            status: "missed",
          })
          .where(and(eq(pick.choice, "under"), eq(pick.propId, updatedProp.id)))
          .returning({ id: pick.id, parlayId: pick.parlayId });

        picksToInvalidateList.push(...misses);
      } else {
        const relatedPicks = await db
          .select({ id: pick.id, parlayId: pick.parlayId })
          .from(pick)
          .where(eq(pick.propId, updatedProp.id));
        picksToInvalidateList.push(...relatedPicks);
      }
    }

    for (const pickToInvalidate of picksToInvalidateList) {
      if (updatedProp.status != "not_resolved") {
        redis.publish(
          "pick_resolved",
          JSON.stringify({ id: pickToInvalidate.id })
        );
      }

      invalidateQueries(
        ["pick", pickToInvalidate.id],
        ["parlay", pickToInvalidate.parlayId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    handleError(error, res, "Picks route");
  }
});
