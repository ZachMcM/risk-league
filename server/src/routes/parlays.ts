import { and, eq, InferInsertModel } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { choiceType, matchUser, parlay, pick, prop } from "../db/schema";
import { logger } from "../logger";
import { apiKeyMiddleware, authMiddleware } from "../middleware";
import { invalidateQueries } from "../utils/invalidateQueries";
import {
  getFlexMultiplier,
  getPerfectPlayMultiplier,
} from "../utils/parlayMultipliers";
import { io } from "..";
import { handleError } from "../utils/handleError";

export const parlaysRoute = Router();

parlaysRoute.get("/parlays/:id", authMiddleware, async (req, res) => {
  try {
    const parlayResult = await db.query.parlay.findFirst({
      where: eq(parlay.id, parseInt(req.params.id)),
      with: {
        picks: {
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

    res.json(parlayResult);
  } catch (error) {
    handleError(error, res, "Parlays route");
  }
});

parlaysRoute.get("/parlays", authMiddleware, async (req, res) => {
  try {
    if (!req.query.matchId) {
      res.status(400).json({
        error: "Missing matchId query string",
      });
      return;
    }

    const matchId = parseInt(req.query.matchId as string);

    const matchUserResult = await db.query.matchUser.findFirst({
      where: and(
        eq(matchUser.userId, res.locals.userId!),
        eq(matchUser.matchId, matchId)
      ),
      with: {
        parlays: {
          with: {
            picks: {
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
        },
      },
    });

    if (!matchUserResult) {
      res.status(404).json({
        error: "No user found to retrieve parlay",
      });
      return;
    }

    res.json(matchUserResult.parlays);
  } catch (error) {
    handleError(error, res, "Parlays route");
  }
});

parlaysRoute.post("/parlays/:matchId", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);

    const matchUserResult = await db.query.matchUser.findFirst({
      where: and(
        eq(matchUser.matchId, matchId),
        eq(matchUser.userId, res.locals.userId!)
      ),
      with: {
        match: {
          with: {
            matchUsers: {
              columns: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!matchUserResult) {
      res.status(401).json({
        error: "Unauthorized request",
      });
      return;
    }

    const { stake, type, picks } = req.body as {
      stake: number | null | undefined;
      type: "flex" | "perfect" | null | undefined;
      picks:
        | {
            prop: InferInsertModel<typeof prop>;
            choice: (typeof choiceType.enumValues)[number];
          }[]
        | null
        | undefined;
    };

    if (stake == undefined) {
      res.status(400).json({ error: "Invalid parlay stake" });
      return;
    }

    if (type == undefined) {
      res.status(400).json({ error: "Invalid parlay type" });
      return;
    }

    if (picks == undefined || picks.length == 0) {
      res.status(400).json({ error: "Invalid picks" });
      return;
    }

    if (type == "flex" && picks.length < 3) {
      res.status(400).json({
        error: "Cannot be a flex play and have less than 3 picks",
      });
      return;
    }

    if (type == "perfect" && picks.length < 2) {
      res.status(400).json({
        error: "Cannot be a perfect play and have less than 2 picks",
      });
      return;
    }

    if (picks.length > 6) {
      res.status(400).json({ error: "Too many picks" });
      return;
    }

    await db
      .update(matchUser)
      .set({ balance: matchUserResult.balance - stake })
      .where(eq(matchUser.id, matchUserResult.id));

    const [parlayResult] = await db
      .insert(parlay)
      .values({
        stake,
        type,
        matchUserId: matchUserResult.id,
      })
      .returning({ id: parlay.id });

    for (const pickEntry of picks) {
      await db.insert(pick).values({
        propId: pickEntry.prop.id!,
        parlayId: parlayResult.id,
        choice: pickEntry.choice,
      });
    }

    // Send invalidation message to update client queries
    invalidateQueries(
      ["match", matchId],
      ["parlays", matchId, matchUserResult.userId],
      ["props", matchUserResult.match.type, matchUserResult.userId, "competitive"],
      ["career", matchUserResult.userId]
    );

    res.json(parlayResult);
  } catch (error: any) {
    logger.error(
      "Parlays route error:",
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ""
    );
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

parlaysRoute.patch("/parlays", apiKeyMiddleware, async (req, res) => {
  try {
    const pickId = req.query.pickId;

    if (!pickId || isNaN(parseInt(pickId as string))) {
      res.status(400).json({ error: "Invalid pickId query string" });
      return;
    }

    const parlayResult = (
      await db.query.pick.findFirst({
        where: eq(pick.id, parseInt(pickId as string)),
        with: {
          parlay: {
            with: {
              picks: true,
              matchUser: {
                columns: {
                  balance: true,
                  matchId: true,
                  userId: true,
                },
              },
            },
          },
        },
      })
    )?.parlay;

    if (!parlayResult) {
      res.status(500).json({
        error: `No parlay found containing a pick with pickId ${pickId}`,
      });
      return;
    }

    let hitCount = 0;
    let ignorePickCount = 0;

    for (const currPick of parlayResult.picks) {
      if (currPick.status == "not_resolved") {
        res.send("All picks not resolved");
        return;
      }
      if (currPick.status == "hit") {
        hitCount++;
      } else if (
        currPick.status == "tie" ||
        currPick.status == "did_not_play"
      ) {
        ignorePickCount++;
      }
    }

    const effectivePickCount = parlayResult.picks.length - ignorePickCount;
    let payout;

    if (parlayResult.type == "perfect") {
      if (effectivePickCount != hitCount) {
        payout = 0;
      } else {
        payout =
          getPerfectPlayMultiplier(effectivePickCount) * parlayResult.stake;
      }
    } else {
      const multiplier = getFlexMultiplier(effectivePickCount, hitCount);
      payout = multiplier * parlayResult.stake;
    }

    await db
      .update(parlay)
      .set({
        profit: payout - parlayResult.stake,
        resolved: true,
      })
      .where(eq(parlay.id, parlayResult.id));

    await db
      .update(matchUser)
      .set({
        balance: (parlayResult.matchUser.balance += payout),
      })
      .where(eq(matchUser.id, parlayResult.matchUserId));

    invalidateQueries(
      ["parlay", parlayResult.id],
      ["match", parlayResult.matchUser.matchId],
      ["career", parlayResult.matchUser.userId]
    );

    io.of("/realtime")
      .to(`user:${parlayResult.matchUser.userId}`)
      .emit("match-parlay-resolved", {
        matchId: parlayResult.matchUser.matchId,
        parlayId: parlayResult.id,
      });

    res.send("Resolved parlay");
  } catch (error) {
    handleError(error, res, "Parlays route");
  }
});
