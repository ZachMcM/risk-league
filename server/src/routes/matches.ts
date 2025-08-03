import { eq, InferSelectModel } from "drizzle-orm";
import { Router } from "express";
import { logger } from "../logger";
import {
  getFlexMultiplier,
  getPerfectPlayMultiplier,
} from "../utils/parlayMultipliers";
import { db } from "../db";
import { matchUser, match, message, matchStatus, user } from "../db/schema";
import { apiKeyMiddleware, authMiddleware } from "../middleware";
import { invalidateQueries } from "../utils/invalidateQueries";

export const matchesRoute = Router();

matchesRoute.get("/matches", authMiddleware, async (req, res) => {
  try {
    const matchResults = await db.query.matchUser.findMany({
      where: eq(matchUser.userId, req.user?.id!),
      with: {
        match: {
          with: {
            matchUsers: {
              with: {
                user: {
                  columns: {
                    id: true,
                    username: true,
                    image: true,
                    points: true,
                  },
                },
                parlays: {
                  with: {
                    picks: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const matchesWithParlayCounts = matchResults.map(
      ({ match, ...fields }) => ({
        ...fields,
        matchUsers: match?.matchUsers.map((mu) => ({
          ...mu,
          parlaysWon: mu.parlays.filter(
            (parlay) => parlay.profit && parlay.profit > 0
          ).length,
          parlaysLost: mu.parlays.filter(
            (parlay) => parlay.profit && parlay.profit < 0
          ).length,
          parlaysInProgress: mu.parlays.filter((parlay) => parlay.resolved)
            .length,
          payoutPotential: mu.parlays
            .filter((parlay) => !parlay.resolved)
            .reduce(
              (accum, curr) =>
                accum +
                curr.stake *
                  (curr.type == "flex"
                    ? getFlexMultiplier(curr.picks.length, curr.picks.length)
                    : getPerfectPlayMultiplier(curr.picks.length)),
              0
            ),
        })),
      })
    );

    res.json(matchesWithParlayCounts);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ err: "Server Error" });
  }
});

matchesRoute.get("/matches/:id", authMiddleware, async (req, res) => {
  const matchId = parseInt(req.params.id);

  try {
    const matchResult = await db.query.match.findFirst({
      where: eq(match.id, matchId),
      with: {
        matchUsers: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                image: true,
                points: true,
              },
            },
            parlays: {
              with: {
                picks: true,
              },
            },
          },
        },
      },
    });

    const matchWithParlayCounts = {
      ...matchResult,
      matchUsers: matchResult?.matchUsers.map((mu) => ({
        ...mu,
        parlaysWon: mu.parlays.filter(
          (parlay) => parlay.profit && parlay.profit > 0
        ).length,
        parlaysLost: mu.parlays.filter(
          (parlay) => parlay.profit && parlay.profit < 0
        ).length,
        parlaysInProgress: mu.parlays.filter((parlay) => !parlay.resolved)
          .length,
        payoutPotential: mu.parlays
          .filter((parlay) => !parlay.resolved)
          .reduce(
            (accum, curr) =>
              accum +
              curr.stake *
                (curr.type == "flex"
                  ? getFlexMultiplier(curr.picks.length, curr.picks.length)
                  : getPerfectPlayMultiplier(curr.picks.length)),
            0
          ),
      })),
    };

    res.json(matchWithParlayCounts);
  } catch (err: any) {
    logger.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

matchesRoute.get("/matches/:id/messages", authMiddleware, async (req, res) => {
  const matchId = req.params.id;

  try {
    const messages = await db.query.message.findMany({
      where: eq(message.matchId, parseInt(matchId)),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            image: true,
            points: true,
          },
        },
      },
      orderBy: [message.createdAt],
    });

    res.json(messages);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

/**
 * Recalculates each users points based on the winner of a match
 *
 * The formula is used is based on the official formula created by Arpad Elo.
 * https://en.wikipedia.org/wiki/Elo_rating_system
 */
function recalculatePoints(currentPoints: number[], winner: number | null) {
  const K = parseInt(process.env.K!);

  const R_A = currentPoints[0];
  const R_B = currentPoints[1];

  let S_A;
  let S_B;

  if (!winner) {
    S_A = 0.5;
    S_B = 0.5;
  } else {
    S_A = winner == 0 ? 1 : 0;
    S_B = 1 - S_A;
  }

  // probability of player one winning
  const E_A = 1 / (1 + Math.pow(10, (R_B - R_A) / 400));

  // probability of player two winning
  const E_B = 1 - E_A;

  const R_prime_A = R_A + K * (S_A - E_A);
  const R_prime_B = R_B + K * (S_B - E_B);

  return [Math.round(R_prime_A), Math.round(R_prime_B)];
}

matchesRoute.patch("matches/end", apiKeyMiddleware, async (_, res) => {
  try {
    const minBetsRequired = parseInt(process.env.MIN_BETS_REQUIRED!);

    const unResolvedMatches = await db.query.match.findMany({
      where: eq(match.resolved, false),
      with: {
        matchUsers: {
          with: {
            user: {
              columns: {
                points: true,
              },
            },
            parlays: true,
          },
        },
      },
    });

    // TODO determine which matches to resolve
    const matchesToEndList = unResolvedMatches.filter((match) => {});

    for (const matchToEnd of matchesToEndList) {
      const matchUser1 = matchToEnd.matchUsers[0];
      const matchUser2 = matchToEnd.matchUsers[1];

      let winner = null;
      let matchUser1Status: (typeof matchStatus.enumValues)[number];
      let matchUser2Status: (typeof matchStatus.enumValues)[number];

      if (
        matchUser1.parlays.length < minBetsRequired &&
        matchUser2.parlays.length >= minBetsRequired
      ) {
        matchUser1Status = "disqualified";
        matchUser2Status = "win";
        winner = 1;
      } else if (
        matchUser2.parlays.length < minBetsRequired &&
        matchUser1.parlays.length >= minBetsRequired
      ) {
        matchUser1Status = "win";
        matchUser2Status = "disqualified";
        winner = 0;
      } else if (
        matchUser2.parlays.length < minBetsRequired &&
        matchUser1.parlays.length < minBetsRequired
      ) {
        matchUser1Status = "disqualified";
        matchUser2Status = "disqualified";
      } else if (matchUser1.balance > matchUser2.balance) {
        matchUser1Status = "win";
        matchUser2Status = "loss";
        winner = 0;
      } else if (matchUser1.balance == matchUser2.balance) {
        matchUser1Status = "draw";
        matchUser2Status = "draw";
      } else {
        matchUser1Status = "loss";
        matchUser2Status = "win";
        winner = 1;
      }

      await db
        .update(matchUser)
        .set({
          status: matchUser1Status,
        })
        .where(eq(matchUser.id, matchUser1.id));

      await db.update(matchUser).set({
        status: matchUser2Status,
      });

      await db
        .update(match)
        .set({
          resolved: true,
        })
        .where(eq(match.id, matchToEnd.id));

      if (matchToEnd.type == "competitive") {
        if (
          matchUser1Status == "disqualified" &&
          matchUser2Status == "disqualified"
        ) {
          continue;
        }

        const newPoints = recalculatePoints(
          [matchUser1.user.points, matchUser2.user.points],
          winner
        );

        await db
          .update(matchUser)
          .set({
            pointsDelta: Math.max(0, newPoints[0] - matchUser1.user.points),
          })
          .where(eq(matchUser.id, matchUser1.id));

        await db
          .update(matchUser)
          .set({
            pointsDelta: Math.max(0, newPoints[1] - matchUser2.user.points),
          })
          .where(eq(matchUser.id, matchUser2.id));

        await db
          .update(user)
          .set({
            points: Math.max(1000, newPoints[0]),
          })
          .where(eq(user.id, matchUser1.userId));

        await db
          .update(user)
          .set({
            points: Math.max(1000, newPoints[1]),
          })
          .where(eq(user.id, matchUser2.userId));
      }

      invalidateQueries(
        ["match", matchToEnd.id],
        ["matches", matchUser1.userId],
        ["matches", matchUser2.userId],
        ["user", matchUser1.userId],
        ["user", matchUser2.userId]
      );
    }

    res.send(`${matchesToEndList.length} matches ended`);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});
