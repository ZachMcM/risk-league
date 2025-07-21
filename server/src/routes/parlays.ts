import { and, eq, InferInsertModel } from "drizzle-orm";
import { Router } from "express";
import { db } from "../drizzle";
import {
  matchUsers,
  parlayPicks,
  parlays,
  pickType,
  props,
} from "../drizzle/schema";
import { authMiddleware } from "./auth";

export const parlaysRoute = Router();

parlaysRoute.get("/parlays/:matchId", async (req, res) => {
  if (!req.query.userId) {
    res.status(400).json({
      error: "Invalid request",
      message: "Invalid query parameters",
    });
    return;
  }

  const userId = parseInt(req.query.userId as string);
  const matchId = parseInt(req.params.matchId);

  try {
    const matchUser = await db.query.matchUsers.findFirst({
      where: and(
        eq(matchUsers.matchId, matchId),
        eq(matchUsers.userId, userId)
      ),
    });

    if (!matchUser) {
      res.status(404).json({
        error: "Not Found",
        message: "No user found to retrieve parlays",
      });
      return;
    }

    const userParlays = await db.query.parlays.findMany({
      where: eq(parlays.matchUserId, matchUser.id),
      with: {
        parlayPicks: {
          with: {
            prop: {
              with: {
                player: {
                  with: {
                    team: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    res.json(userParlays);
  } catch (err) {
    res.status(500).json({
      error: "Server Error",
      message: err,
    });
  }
});

parlaysRoute.post("/parlays/:matchId", authMiddleware, async (req, res) => {
  const userId = parseInt(res.locals.userId);
  const matchId = parseInt(req.params.matchId);

  try {
    const matchUser = await db.query.matchUsers.findFirst({
      where: and(
        eq(matchUsers.matchId, matchId),
        eq(matchUsers.userId, userId)
      ),
    });

    if (!matchUser) {
      res.status(401).json({
        error: "Unauthorized request",
        message: "User is unauthorized",
      });
      return;
    }

    const { stake, picks, type } = req.body as {
      stake: number | null | undefined;
      type: "flex" | "perfect" | null | undefined;
      picks:
        | {
            prop: InferInsertModel<typeof props>;
            pick: (typeof pickType.enumValues)[number];
          }[]
        | null
        | undefined;
    };

    if (!stake) {
      res
        .status(400)
        .json({ error: "Invalid request", message: "Invalid parlay stake" });
      return;
    }

    if (!type) {
      res
        .status(400)
        .json({ error: "Invalid request", message: "Invalid parlay type" });
      return;
    }

    if (!picks || picks.length == 0) {
      res
        .status(400)
        .json({ error: "Invalid request", message: "Invalid picks" });
      return;
    }

    if (type == "flex" && picks.length < 3) {
      res.status(400).json({
        error: "Invalid request",
        message: "Cannot be a flex play and have less than 3 picks",
      });
      return;
    }

    if (type == "perfect" && picks.length < 2) {
      res.status(400).json({
        error: "Invalid request",
        message: "Cannot be a perfect play and have less than 2 picks",
      });
      return;
    }

    if (picks.length > 6) {
      res
        .status(400)
        .json({ error: "Invalid request", message: "Too many picks" });
      return;
    }

    const existingPlayerIds: number[] = [];
    for (const pick of picks) {
      if (existingPlayerIds.includes(pick.prop.playerId!)) {
        res.status(400).json({
          error: "Invalid request",
          message: "Cannot pick the same player twice",
        });
        return;
      }
    }

    await db
      .update(matchUsers)
      .set({ balance: matchUser.balance - stake })
      .where(eq(matchUsers.id, matchUser.id));

    const [parlay] = await db
      .insert(parlays)
      .values({
        stake,
        type,
        matchUserId: matchUser.id,
      })
      .returning({ id: parlays.id });

    for (const pick of picks) {
      await db.insert(parlayPicks).values({
        propId: pick.prop.id,
        pick: pick.pick,
        parlayId: parlay.id,
      });
    }

    res.json(parlay)
  } catch (err: any) {
    res.status(500).json({
      error: "Server error",
      message: err,
    });
  }
});
