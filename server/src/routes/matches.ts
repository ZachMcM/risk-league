import { eq, count } from "drizzle-orm";
import { Router } from "express";
import { db } from "../drizzle";
import { matches, matchMessages, matchUsers, parlays } from "../drizzle/schema";
import { logger } from "../logger";
import { authMiddleware } from "./auth";
import {
  getFlexMultiplier,
  getPerfectPlayMultiplier,
} from "../utils/parlayMultipliers";

export const matchesRoute = Router();

matchesRoute.get("/matches", authMiddleware, async (req, res) => {
  const userId = parseInt(res.locals.userId);

  try {
    const userMatches = await db.query.matchUsers.findMany({
      where: eq(matchUsers.userId, userId),
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
                    eloRating: true,
                  },
                },
                parlays: {
                  with: {
                    parlayPicks: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const matches = userMatches.map((userMatch) => ({
      ...userMatch.match,
      matchUsers: userMatch.match?.matchUsers.map((mu) => ({
        ...mu,
        parlaysWon: mu.parlays.filter(
          (parlay) => parlay.delta && parlay.delta > 0
        ).length,
        parlaysLost: mu.parlays.filter(
          (parlay) => parlay.delta && parlay.delta < 0
        ).length,
        parlaysInProgress: mu.parlays.filter((parlay) => parlay.resolved)
          .length,
        potentialPayout: mu.parlays
          .filter((parlay) => !parlay.resolved)
          .reduce(
            (accum, curr) =>
              accum +
              curr.stake *
                (curr.type == "flex"
                  ? getFlexMultiplier(
                      curr.parlayPicks.length,
                      curr.parlayPicks.length
                    )
                  : getPerfectPlayMultiplier(curr.parlayPicks.length)),
            0
          ),
      })),
    }));

    res.json(matches);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ err: "Server Error", message: err });
  }
});

matchesRoute.get("/matches/:id", authMiddleware, async (req, res) => {
  const matchId = parseInt(req.params.id);

  try {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        matchUsers: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                image: true,
                eloRating: true,
              },
            },
            parlays: {
              with: {
                parlayPicks: true,
              },
            },
          },
        },
      },
    });

    const matchWithParlayCount = {
      ...match,
      matchUsers: match?.matchUsers.map((mu) => ({
        ...mu,
        parlaysWon: mu.parlays.filter(
          (parlay) => parlay.delta && parlay.delta > 0
        ).length,
        parlaysLost: mu.parlays.filter(
          (parlay) => parlay.delta && parlay.delta < 0
        ).length,
        parlaysInProgress: mu.parlays.filter((parlay) => !parlay.resolved)
          .length,
        potentialPayout: mu.parlays
          .filter((parlay) => !parlay.resolved)
          .reduce(
            (accum, curr) =>
              accum +
              curr.stake *
                (curr.type == "flex"
                  ? getFlexMultiplier(
                      curr.parlayPicks.length,
                      curr.parlayPicks.length
                    )
                  : getPerfectPlayMultiplier(curr.parlayPicks.length)),
            0
          ),
      })),
    };

    res.json(matchWithParlayCount);
  } catch (err: any) {
    logger.error(err);
    res.status(500).json({ error: "Server Error", message: err });
  }
});

matchesRoute.get("/matches/:id/messages", authMiddleware, async (req, res) => {
  const matchId = req.params.id;

  try {
    const messages = await db.query.matchMessages.findMany({
      where: eq(matchMessages.matchId, parseInt(matchId)),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            image: true,
            eloRating: true,
          },
        },
      },
      orderBy: [matchMessages.createdAt],
    });

    res.json(messages);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Server Error", message: err });
  }
});
