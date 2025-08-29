import { and, asc, desc, eq, InferInsertModel } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import {
  choiceType,
  dynastyLeagueUser,
  matchUser,
  parlay,
  pick,
  prop,
} from "../db/schema";
import { logger } from "../logger";
import { apiKeyMiddleware, authMiddleware } from "../middleware";
import { invalidateQueries } from "../utils/invalidateQueries";
import {
  getFlexMultiplier,
  getPerfectPlayMultiplier,
} from "../utils/parlayMultipliers";
import { io } from "..";
import { handleError } from "../utils/handleError";
import { MIN_STAKE_PCT } from "../config";

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
                game: {
                  with: {
                    homeTeam: true,
                    awayTeam: true,
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
    if (!req.query.matchId && !req.query.dynastyLeagueId) {
      res.status(400).json({
        error: "You need either a matchId or dynastyLeagueId",
      });
      return;
    }

    if (req.query.matchId) {
      const matchId = parseInt(req.query.matchId as string);

      if (isNaN(matchId)) {
        res.status(400).json({ error: "Invalid matchId" });
        return;
      }

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
        orderBy: asc(parlay.createdAt),
      });

      if (!matchUserResult) {
        res.status(404).json({
          error: "No user found to retrieve parlay",
        });
        return;
      }

      res.json(matchUserResult.parlays);
      return;
    }

    const dynastyLeagueId = parseInt(req.query.dynastyLeagueId as string);

    if (isNaN(dynastyLeagueId)) {
      res.status(400).json({ error: "Invalid dynastyLeagueId" });
      return;
    }

    const dynastyLeagueUserResult = await db.query.dynastyLeagueUser.findFirst({
      where: and(
        eq(dynastyLeagueUser.userId, res.locals.userId!),
        eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
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
      orderBy: asc(parlay.createdAt),
    });

    if (!dynastyLeagueUserResult) {
      res.status(404).json({
        error: "No user found to retrieve parlay",
      });
      return;
    }

    res.json(dynastyLeagueUserResult.parlays);
  } catch (error) {
    handleError(error, res, "Parlays route");
  }
});

parlaysRoute.post("/parlays", authMiddleware, async (req, res) => {
  try {
    if (!req.query.matchId && !req.query.dynastyLeagueId) {
      res.status(400).json({
        error:
          "Invalid query params, you need to provide either a matchId or dynastyLeagueId",
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

    if (req.query.matchId) {
      const matchId = parseInt(req.query.matchId as string);
      if (isNaN(matchId)) {
        res.status(400).json({ error: "Invalid matchId" });
        return;
      }

      const matchUserResult = await db.query.matchUser.findFirst({
        where: and(
          eq(matchUser.matchId, matchId),
          eq(matchUser.userId, res.locals.userId!)
        ),
        with: {
          match: true,
        },
      });

      if (!matchUserResult) {
        res.status(404).json({
          error: "No matchUser found",
        });
        return;
      }

      if (matchUserResult.balance < stake) {
        res.status(409).json({ error: "Your balance is too small" });
        return;
      }

      if (stake < matchUserResult.balance * MIN_STAKE_PCT) {
        res.status(400).json({ error: "Your stake is too small" });
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
        ["parlays", "match", matchId, matchUserResult.userId],
        ["props", "match", matchUserResult.matchId, matchUserResult.userId],
        ...picks.map((pickEntry) => [
          "player-props",
          "match",
          matchUserResult.matchId,
          pickEntry.prop.playerId,
          matchUserResult.userId,
        ]),
        ["career", matchUserResult.userId]
      );

      res.json({ success: true });
      return;
    }
    const dynastyLeagueId = parseInt(req.query.dynastyLeagueId as string);

    if (isNaN(dynastyLeagueId)) {
      res.status(400).json({ error: "Invalid dynastyLeagueId" });
      return;
    }

    const dynastyLeagueUserResult = await db.query.dynastyLeagueUser.findFirst({
      where: and(
        eq(dynastyLeagueUser.userId, res.locals.userId!),
        eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
      ),
    });

    if (!dynastyLeagueUserResult) {
      res.status(404).json({ error: "No dynastyLeagueUser found" });
      return;
    }

    if (dynastyLeagueUserResult.balance < stake) {
      res.status(409).json({ error: "Your balance is too small" });
      return;
    }

    if (stake < dynastyLeagueUserResult.balance * MIN_STAKE_PCT) {
      res.status(400).json({ error: "Your stake is too small" });
      return;
    }

    await db
      .update(dynastyLeagueUser)
      .set({ balance: dynastyLeagueUserResult.balance - stake })
      .where(eq(dynastyLeagueUser.id, dynastyLeagueUserResult.id));

    const [parlayResult] = await db
      .insert(parlay)
      .values({
        stake,
        type,
        dynastyLeagueUserId: dynastyLeagueUserResult.id,
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
      ["dynasty-league", dynastyLeagueUserResult.dynastyLeagueId, "users"],
      [
        "parlays",
        "dynasty",
        dynastyLeagueUserResult.dynastyLeagueId,
        dynastyLeagueUserResult.userId,
      ],
      [
        "props",
        "dynasty",
        dynastyLeagueUserResult.dynastyLeagueId,
        dynastyLeagueUserResult.userId,
      ],
      ...picks.map((pickEntry) => [
        "player-props",
        "dynasty",
        dynastyLeagueUserResult.dynastyLeagueId,
        pickEntry.prop.playerId,
        dynastyLeagueUserResult.userId,
      ]),
      ["career", dynastyLeagueUserResult.userId]
    );

    res.json({ success: true });
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
              dynastyLeagueUser: {
                columns: {
                  balance: true,
                  dynastyLeagueId: true,
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
        res.json({ success: true });
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

    if (parlayResult.matchUser) {
      await db
        .update(matchUser)
        .set({
          balance: parlayResult.matchUser.balance + payout,
        })
        .where(eq(matchUser.id, parlayResult.matchUserId!));

      invalidateQueries(
        ["parlay", parlayResult.id],
        [
          "parlays",
          "match",
          parlayResult.matchUser.matchId,
          parlayResult.matchUser.userId,
        ],
        ["match", parlayResult.matchUser.matchId],
        ["matches", parlayResult.matchUser.userId, "unresolved"],
        ["career", parlayResult.matchUser.userId]
      );

      io.of("/realtime")
        .to(`user:${parlayResult.matchUser.userId}`)
        .emit("match-parlay-resolved", {
          matchId: parlayResult.matchUser.matchId,
          parlayId: parlayResult.id,
        });
    } else if (parlayResult.dynastyLeagueUser) {
      await db
        .update(dynastyLeagueUser)
        .set({
          balance: parlayResult.dynastyLeagueUser.balance + payout,
        })
        .where(eq(dynastyLeagueUser.id, parlayResult.dynastyLeagueUserId!));

      invalidateQueries(
        ["parlay", parlayResult.id],
        [
          "parlays",
          "dynasty",
          parlayResult.dynastyLeagueUser.dynastyLeagueId,
          parlayResult.dynastyLeagueUser.userId,
        ],
        [
          "dynastyLeague",
          parlayResult.dynastyLeagueUser.dynastyLeagueId,
          "users",
        ],
        ["career", parlayResult.dynastyLeagueUser.userId]
      );

      io.of("/realtime")
        .to(`user:${parlayResult.dynastyLeagueUser.userId}`)
        .emit("dynasty-league-parlay-resolved", {
          matchId: parlayResult.dynastyLeagueUser.dynastyLeagueId,
          parlayId: parlayResult.id,
        });
    }

    res.json({ success: true });
  } catch (error) {
    handleError(error, res, "Parlays route");
  }
});
