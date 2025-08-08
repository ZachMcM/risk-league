import { eq } from "drizzle-orm";
import { Router } from "express";
import { io } from "..";
import { db } from "../db";
import { match, matchStatus, matchUser, message, user } from "../db/schema";
import { logger } from "../logger";
import { apiKeyMiddleware, authMiddleware } from "../middleware";
import { calculateProgressionDelta } from "../utils/calculateProgressionDelta";
import { findRank } from "../utils/findRank";
import { invalidateQueries } from "../utils/invalidateQueries";
import {
  getFlexMultiplier,
  getPerfectPlayMultiplier,
} from "../utils/parlayMultipliers";

export const matchesRoute = Router();

matchesRoute.get("/matches", authMiddleware, async (_, res) => {
  try {
    const matchUserResults = await db.query.matchUser.findMany({
      where: eq(matchUser.userId, res.locals.userId!),
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
                  },
                },
              },
            },
          },
        },
      },
    });

    const matchesWithParlayCounts = matchUserResults.map(({ match }) => ({
      ...match,
      matchUsers: match?.matchUsers.map((mu) => ({
        ...mu,
        progressionDelta: calculateProgressionDelta(
          mu.pointsSnapshot,
          mu.pointsDelta
        ),
        rankSnapshot: findRank(mu.pointsSnapshot),
      })),
    }));

    res.json(matchesWithParlayCounts);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error });
  }
});

matchesRoute.get("/matches/:id", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);

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
        progressionDelta: calculateProgressionDelta(
          mu.pointsSnapshot,
          mu.pointsDelta
        ),
        rankSnapshot: findRank(mu.pointsSnapshot),
        totalStaked: mu.parlays.reduce((accum, curr) => accum + curr.stake, 0),
        totalParlays: mu.parlays.length,
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
    res.status(500).json({ error: err });
  }
});

matchesRoute.get("/matches/:id/messages", authMiddleware, async (req, res) => {
  try {
    const matchId = req.params.id;

    const messages = await db.query.message.findMany({
      where: eq(message.matchId, parseInt(matchId)),
      with: {
        user: {
          columns: {
            id: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy: [message.createdAt],
    });

    res.json(messages);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error });
  }
});

matchesRoute.post("/matches/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body as {
      content: string | undefined;
    };

    if (!content) {
      res
        .status(400)
        .json({ error: "Invalid request body, missing message content" });
      return;
    }

    const [newMessage] = await db
      .insert(message)
      .values({
        userId: res.locals.userId!,
        content,
        matchId: parseInt(req.params.id),
      })
      .returning({ id: message.id });

    invalidateQueries(["match", parseInt(req.params.id), "messages"]);

    const messageWithUser = await db.query.message.findFirst({
      where: eq(message.id, newMessage.id),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    });

    const matchUsers = await db.query.matchUser.findMany({
      where: eq(matchUser.matchId, parseInt(req.params.id)),
      columns: {
        userId: true,
      },
    });

    for (const user of matchUsers) {
      io.of("/realtime")
        .to(`user:${user.userId}`)
        .emit("match-message-received", messageWithUser);
    }

    res.json(newMessage.id);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error });
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

matchesRoute.patch("/matches/end", apiKeyMiddleware, async (_, res) => {
  try {
    const minParlaysRequired = parseInt(process.env.MIN_PARLAYS_REQUIRED!);
    const minPctTotalStaked = parseFloat(process.env.MIN_PCT_TOTAL_STAKED!);

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
    const matchesToEndList = unResolvedMatches.filter((match) => true);

    for (const matchToEnd of matchesToEndList) {
      const matchUser1 = matchToEnd.matchUsers[0];
      const matchUser2 = matchToEnd.matchUsers[1];

      let winner = null;
      let matchUser1Status: (typeof matchStatus.enumValues)[number];
      let matchUser2Status: (typeof matchStatus.enumValues)[number];

      const matchUser1TotalStaked = matchUser1.parlays.reduce(
        (accum, curr) => accum + curr.stake,
        0
      );

      const matchUser2TotalStaked = matchUser2.parlays.reduce(
        (accum, curr) => accum + curr.stake,
        0
      );

      const matchUser1MinTotalStaked = Math.round(
        matchUser1.startingBalance * minPctTotalStaked
      );
      const matchUser2MinTotalStaked = Math.round(
        matchUser2.startingBalance * minPctTotalStaked
      );

      if (
        (matchUser1.parlays.length < minParlaysRequired ||
          matchUser1TotalStaked < matchUser1MinTotalStaked) &&
        matchUser2.parlays.length >= minParlaysRequired &&
        matchUser2TotalStaked >= matchUser2MinTotalStaked
      ) {
        matchUser1Status = "disqualified";
        matchUser2Status = "win";
        winner = 1;
      } else if (
        (matchUser2.parlays.length < minParlaysRequired ||
          matchUser2TotalStaked < matchUser2MinTotalStaked) &&
        matchUser1.parlays.length >= minParlaysRequired &&
        matchUser1TotalStaked >= matchUser1MinTotalStaked
      ) {
        matchUser1Status = "win";
        matchUser2Status = "disqualified";
        winner = 0;
      } else if (
        (matchUser2.parlays.length < minParlaysRequired ||
          matchUser2TotalStaked < matchUser2MinTotalStaked) &&
        (matchUser1.parlays.length < minParlaysRequired ||
          matchUser1TotalStaked < matchUser1MinTotalStaked)
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
          matchUser1Status != "disqualified" ||
          matchUser2Status != "disqualified"
        ) {
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
      }

      invalidateQueries(
        ["match", matchToEnd.id],
        ["matches", matchUser1.userId],
        ["matches", matchUser2.userId],
        ["user", matchUser1.userId],
        ["user", matchUser2.userId],
        ["career", matchUser1.userId],
        ["career", matchUser2.userId]
      );

      for (const userId of [matchUser1.userId, matchUser2.userId]) {
        io.of("/realtime").to(`user:${userId}`).emit("match-ended", {
          type: matchToEnd.type,
          league: matchToEnd.league,
          id: matchToEnd.id,
        });
      }
    }

    res.send(`${matchesToEndList.length} matches ended`);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error });
  }
});
