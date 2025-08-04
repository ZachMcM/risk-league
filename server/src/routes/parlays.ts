import { and, eq, InferInsertModel } from "drizzle-orm";
import { Router } from "express";
import { invalidateQueries } from "../utils/invalidateQueries";
import { db } from "../db";
import { choiceType, match, matchUser, parlay, pick, prop } from "../db/schema";
import { apiKeyMiddleware, authMiddleware } from "../middleware";
import {
  getFlexMultiplier,
  getPerfectPlayMultiplier,
} from "../utils/parlayMultipliers";

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
  } catch (err) {
    res.status(500).json({
      error: "Server Error",
    });
  }
});

parlaysRoute.get("/parlays", authMiddleware, async (req, res) => {
  if (!req.query.matchId) {
    res.status(400).json({
      error: "Missing matchId query string",
    });
    return;
  }

  const matchId = parseInt(req.query.matchId as string);

  try {
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
  } catch (err) {
    res.status(500).json({
      error: "Server Error",
    });
  }
});

parlaysRoute.post("/parlays/:matchId", authMiddleware, async (req, res) => {
  const matchId = parseInt(req.params.matchId);

  try {
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

    const body = req.body as {
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

    if (!body.stake) {
      res.status(400).json({ error: "Invalid parlay stake" });
      return;
    }

    if (!body.type) {
      res.status(400).json({ error: "Invalid parlay type" });
      return;
    }

    if (!body.picks || body.picks.length == 0) {
      res.status(400).json({ error: "Invalid picks" });
      return;
    }

    if (body.type == "flex" && body.picks.length < 3) {
      res.status(400).json({
        error: "Cannot be a flex play and have less than 3 picks",
      });
      return;
    }

    if (body.type == "perfect" && body.picks.length < 2) {
      res.status(400).json({
        error: "Cannot be a perfect play and have less than 2 picks",
      });
      return;
    }

    if (body.picks.length > 6) {
      res.status(400).json({ error: "Too many picks" });
      return;
    }

    const existingPlayerIds: number[] = [];
    for (const pick of body.picks) {
      if (existingPlayerIds.includes(pick.prop.playerId!)) {
        res.status(400).json({
          error: "Cannot pick the same player twice",
        });
        return;
      }
    }

    await db
      .update(matchUser)
      .set({ balance: matchUserResult.balance - body.stake })
      .where(eq(matchUser.id, matchUser.id));

    const [parlayResult] = await db
      .insert(parlay)
      .values({
        stake: body.stake,
        type: body.type,
        matchUserId: matchUserResult.id,
      })
      .returning({ id: parlay.id });

    for (const pickEntry of body.picks) {
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
      ["matches", matchUserResult.match.matchUsers[0].userId],
      ["matches", matchUserResult.match.matchUsers[1].userId]
    );

    res.json(parlay);
  } catch (err: any) {
    res.status(500).json({
      error: "Server error",
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
      [
        "parlays",
        parlayResult.matchUser.matchId,
        parlayResult.matchUser.userId,
      ],
      ["match", parlayResult.matchUser.matchId],
      ["matches", parlayResult.matchUser.match.matchUsers[0].userId],
      ["matches", parlayResult.matchUser.match.matchUsers[1].userId]
    );

    res.send("Resolved parlay");
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});
