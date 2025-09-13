import { and, desc, eq, gt, InferInsertModel, lt } from "drizzle-orm";
import { Router } from "express";
import { io } from "..";
import { MIN_STAKE_PCT } from "../config";
import { db } from "../db";
import {
  choiceType,
  dynastyLeague,
  dynastyLeagueUser,
  matchUser,
  parlay,
  pick,
  prop,
} from "../db/schema";
import { logger } from "../logger";
import { apiKeyMiddleware, authMiddleware } from "../middleware";
import { handleError } from "../utils/handleError";
import { invalidateQueries } from "../utils/invalidateQueries";
import {
  getFlexMultiplier,
  getPerfectPlayMultiplier,
} from "../utils/parlayMultipliers";
import { redis } from "../redis";

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
          orderBy: desc(pick.createdAt),
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
            orderBy: (parlay, { desc }) => [desc(parlay.createdAt)],
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
                orderBy: desc(pick.createdAt),
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
          orderBy: (parlay, { desc }) => [desc(parlay.createdAt)],
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
              orderBy: desc(pick.createdAt),
            },
          },
        },
      },
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

      if (stake < Math.floor(matchUserResult.balance * MIN_STAKE_PCT)) {
        res.status(400).json({
          error: `Your stake is too small, must be at least ${
            matchUserResult.balance * MIN_STAKE_PCT
          }`,
        });
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

      res.json({ parlayId: parlayResult.id });
      return;
    }
    const dynastyLeagueId = parseInt(req.query.dynastyLeagueId as string);

    if (isNaN(dynastyLeagueId)) {
      res.status(400).json({ error: "Invalid dynastyLeagueId" });
      return;
    }

    const dynastyLeagueResult = await db.query.dynastyLeague.findFirst({
      where: and(
        eq(dynastyLeague.id, dynastyLeagueId),
        lt(dynastyLeague.startDate, new Date().toISOString()),
        gt(dynastyLeague.endDate, new Date().toISOString())
      ),
    });

    if (!dynastyLeagueResult) {
      res.status(409).json({ error: "No valid dynasty league found" });
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
        "dynasty-league",
        dynastyLeagueUserResult.dynastyLeagueId,
        dynastyLeagueUserResult.userId,
      ],
      [
        "props",
        "dynasty-league",
        dynastyLeagueUserResult.dynastyLeagueId,
        dynastyLeagueUserResult.userId,
      ],
      ...picks.map((pickEntry) => [
        "player-props",
        "dynasty-league",
        dynastyLeagueUserResult.dynastyLeagueId,
        pickEntry.prop.playerId,
        dynastyLeagueUserResult.userId,
      ]),
      ["career", dynastyLeagueUserResult.userId]
    );

    res.json({ parlayId: parlayResult.id });
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

    const pickResult = await db.query.pick.findFirst({
      where: eq(pick.id, parseInt(pickId as string)),
      columns: { id: true }
    });

    if (!pickResult) {
      res.status(404).json({ error: "Pick not found" });
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

    if (parlayResult.resolved) {
      res.status(200).json({ message: "Parlay is already resolved" });
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
      // For flex plays with ties that reduce to 1 effective pick, treat as loss
      if (effectivePickCount < 2) {
        payout = 0;
      } else {
        payout =
          getFlexMultiplier(effectivePickCount, hitCount) * parlayResult.stake;
      }
    }

    logger.info(`Parlay ${parlayResult.id} resolution triggered by pick ${pickId}, payout: ${payout}`);

    await db.transaction(async (tx) => {
      await tx
        .update(parlay)
        .set({
          profit: payout - parlayResult.stake,
          resolved: true,
        })
        .where(eq(parlay.id, parlayResult.id));

      if (parlayResult.matchUser) {
        await tx
          .update(matchUser)
          .set({
            balance: parlayResult.matchUser.balance + payout,
          })
          .where(eq(matchUser.id, parlayResult.matchUserId!));
      } else if (parlayResult.dynastyLeagueUser) {
        await tx
          .update(dynastyLeagueUser)
          .set({
            balance: parlayResult.dynastyLeagueUser.balance + payout,
          })
          .where(eq(dynastyLeagueUser.id, parlayResult.dynastyLeagueUserId!));
      }
    });

    if (parlayResult.matchUser) {
      invalidateQueries(
        ["parlay", parlayResult.id],
        [
          "parlays",
          "match",
          parlayResult.matchUser.matchId,
          parlayResult.matchUser.userId,
        ],
        ["match", parlayResult.matchUser.matchId],
        ["match-ids", parlayResult.matchUser.userId, "unresolved"],
        ["career", parlayResult.matchUser.userId]
      );

      io.of("/realtime")
        .to(`user:${parlayResult.matchUser.userId}`)
        .emit("match-parlay-resolved", {
          matchId: parlayResult.matchUser.matchId,
          parlayId: parlayResult.id,
        });

      redis.publish("parlay_resolved", JSON.stringify({
        parlayId: parlayResult.id,
        matchId: parlayResult.matchUser.matchId
      }));
    } else if (parlayResult.dynastyLeagueUser) {
      invalidateQueries(
        ["parlay", parlayResult.id],
        [
          "parlays",
          "dynasty-league",
          parlayResult.dynastyLeagueUser.dynastyLeagueId,
          parlayResult.dynastyLeagueUser.userId,
        ],
        [
          "dynasty-league",
          parlayResult.dynastyLeagueUser.dynastyLeagueId,
          "users",
        ],
        ["career", parlayResult.dynastyLeagueUser.userId]
      );

      io.of("/realtime")
        .to(`user:${parlayResult.dynastyLeagueUser.userId}`)
        .emit("dynasty-league-parlay-resolved", {
          dynastyLeagueId: parlayResult.dynastyLeagueUser.dynastyLeagueId,
          parlayId: parlayResult.id,
        });
    }

    res.json({ success: true });
  } catch (error) {
    handleError(error, res, "Parlays route");
  }
});
