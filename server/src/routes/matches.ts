import { and, desc, eq, ne } from "drizzle-orm";
import { Router } from "express";
import { io } from "..";
import { db } from "../db";
import { match, matchUser, message } from "../db/schema";
import { logger } from "../logger";
import { authMiddleware } from "../middleware";
import { calculateProgressionDelta } from "../utils/calculateProgressionDelta";
import { findRank } from "../utils/findRank";
import { handleError } from "../utils/handleError";
import { invalidateQueries } from "../utils/invalidateQueries";
import {
  getFlexMultiplier,
  getPerfectPlayMultiplier,
} from "../utils/parlayMultipliers";
import { sendPushNotification } from "./pushNotifications";

export const matchesRoute = Router();

matchesRoute.get("/matches", authMiddleware, async (req, res) => {
  try {
    const resolvedString = req.query.resolved as string | undefined;

    if (!resolvedString) {
      res
        .status(400)
        .json({ error: "Invalid query string, missing resolved query string" });
      return;
    }

    const resolved = resolvedString === "true";

    if (resolved) {
      const matchUserResults = await db.query.matchUser.findMany({
        where: and(
          eq(matchUser.userId, res.locals.userId!),
          ne(matchUser.status, "not_resolved")
        ),
        columns: {
          matchId: true,
        },
        orderBy: desc(matchUser.createdAt),
        limit: 50,
      });

      const matchIds = matchUserResults.map(({ matchId }) => matchId);
      res.json(matchIds);
      return;
    }

    const matchUserResults = await db.query.matchUser.findMany({
      where: and(
        eq(matchUser.userId, res.locals.userId!),
        eq(matchUser.status, "not_resolved")
      ),
      columns: {
        matchId: true,
      },
      orderBy: desc(matchUser.createdAt),
    });

    const matchIds = matchUserResults.map(({ matchId }) => matchId);
    res.json(matchIds);
  } catch (error) {
    handleError(error, res, "Matches route");
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
          (parlay) => parlay.payout > 0 && parlay.resolved
        ).length,
        parlaysLost: mu.parlays.filter(
          (parlay) => parlay.payout == 0 && parlay.resolved
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
  } catch (error: any) {
    logger.error(
      "Matches route error:",
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ""
    );
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : String(error) });
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
      orderBy: message.createdAt,
    });

    res.json(messages);
  } catch (error) {
    handleError(error, res, "Matches route");
  }
});

matchesRoute.post("/matches/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body as {
      content: string | undefined;
    };

    if (content == undefined) {
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

    const otherMatchUser = await db.query.matchUser.findFirst({
      where: and(
        eq(matchUser.matchId, parseInt(req.params.id)),
        ne(matchUser.userId, res.locals.userId!)
      ),
      columns: {
        userId: true,
      },
    });

    if (!otherMatchUser) {
      res.status(500).json({ error: "No other match user found" })
      return
    }

    sendPushNotification(
      otherMatchUser.userId,
      "Match Message",
      `${messageWithUser?.user.username || "Someone:"} ${content.substring(
        0,
        50
      )}${content.length > 50 ? "..." : ""}`,
      { url: `/match/${req.params.id}?openSubRoute=messages` }
    );

    res.json(newMessage.id);
  } catch (error) {
    handleError(error, res, "Matches route");
  }
});
