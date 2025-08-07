import { Router } from "express";
import { apiKeyMiddleware } from "../middleware";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
import { pick, prop } from "../db/schema";
import { redis } from "../redis";
import { invalidateQueries } from "../utils/invalidateQueries";
import { logger } from "../logger";

export const picksRoute = Router();

picksRoute.patch("/picks", apiKeyMiddleware, async (req, res) => {
  try {
    const propId = req.query.propId;

    if (!propId || isNaN(parseInt(propId as string))) {
      res.status(400).json({ error: "Invalid propId query string" });
      return;
    }

    const updatedProp = await db.query.prop.findFirst({
      where: eq(prop.id, parseInt(propId as string)),
    });

    if (!updatedProp) {
      res.status(400).json({ error: `No prop found wiht propId ${propId}` });
      return;
    }

    const picksToInvalidateList: { id: number }[] = [];

    if (updatedProp.resolved) {
      if (updatedProp.currentValue > updatedProp.line) {
        const hits = await db
          .update(pick)
          .set({
            status: "hit",
          })
          .where(and(eq(pick.choice, "over"), eq(pick.propId, updatedProp.id)))
          .returning({ id: pick.id });

        picksToInvalidateList.push(...hits);

        const misses = await db
          .update(pick)
          .set({
            status: "missed",
          })
          .where(and(eq(pick.choice, "under"), eq(pick.propId, updatedProp.id)))
          .returning({ id: pick.id });

        picksToInvalidateList.push(...misses);
      } else if (updatedProp.currentValue == updatedProp.line) {
        const ties = await db
          .update(pick)
          .set({
            status: "tie",
          })
          .where(eq(pick.propId, updatedProp.id))
          .returning({ id: pick.id });

        picksToInvalidateList.push(...ties);
      } else {
        const misses = await db
          .update(pick)
          .set({
            status: "missed",
          })
          .where(and(eq(pick.choice, "over"), eq(pick.propId, updatedProp.id)))
          .returning({ id: pick.id });

        picksToInvalidateList.push(...misses);

        const hits = await db
          .update(pick)
          .set({
            status: "hit",
          })
          .where(and(eq(pick.choice, "under"), eq(pick.propId, updatedProp.id)))
          .returning({ id: pick.id });

        picksToInvalidateList.push(...hits);
      }
    } else if (updatedProp.currentValue > updatedProp.line) {
      const hits = await db
        .update(pick)
        .set({
          status: "hit",
        })
        .where(and(eq(pick.choice, "over"), eq(pick.propId, updatedProp.id)))
        .returning({ id: pick.id });

      picksToInvalidateList.push(...hits);

      const misses = await db
        .update(pick)
        .set({
          status: "missed",
        })
        .where(and(eq(pick.choice, "under"), eq(pick.propId, updatedProp.id)))
        .returning({ id: pick.id });

      picksToInvalidateList.push(...misses);
    }

    for (const pickToInvalidate of picksToInvalidateList) {
      if (prop.resolved) {
        redis.publish(
          "pick_updated",
          JSON.stringify({ id: pickToInvalidate.id })
        );
      }

      const extendedPick = await db.query.pick.findFirst({
        where: eq(pick.id, pickToInvalidate.id),
        with: {
          parlay: {
            with: {
              matchUser: {
                columns: {
                  matchId: true,
                  userId: true,
                },
              },
            },
          },
        },
      });

      invalidateQueries(
        [
          "parlays",
          extendedPick?.parlay.matchUser.matchId!,
          extendedPick?.parlay.matchUser.userId!,
        ],
        ["parlay", extendedPick?.parlayId!],
        ["career", extendedPick?.parlay.matchUser.userId!]
      );
    }

    res.send(`${picksToInvalidateList.length} picks updated`);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error });
  }
});
