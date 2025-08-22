import { and, eq, or } from "drizzle-orm";
import { Router } from "express";
import { io } from "..";
import { db } from "../db";
import { friendlyMatchRequest, friendship, user } from "../db/schema";
import { logger } from "../logger";
import { authMiddleware } from "../middleware";
import { findRank } from "../utils/findRank";
import { invalidateQueries } from "../utils/invalidateQueries";
import { handleError } from "../utils/handleError";

export const friendshipsRoute = Router();

friendshipsRoute.get("/friendship", authMiddleware, async (req, res) => {
  try {
    const otherUserId = req.query.otherUserId as string | undefined;

    if (otherUserId === undefined) {
      res.status(400).json({ error: "Invalid request, missing otherUserId" });
      return;
    }

    const friendshipResult = await db.query.friendship.findFirst({
      where: or(
        and(
          eq(friendship.outgoingId, res.locals.userId!),
          eq(friendship.incomingId, otherUserId)
        ),
        and(
          eq(friendship.outgoingId, otherUserId),
          eq(friendship.incomingId, res.locals.userId!)
        )
      ),
    });

    res.json(friendshipResult)
  } catch (error) {
    handleError(error, res, "Friendships");
  }
});

friendshipsRoute.get("/friendships", authMiddleware, async (_, res) => {
  try {
    const friendshipResults = await db.query.friendship.findMany({
      where: or(
        eq(friendship.incomingId, res.locals.userId!),
        eq(friendship.outgoingId, res.locals.userId!)
      ),
      with: {
        incomingUser: {
          columns: {
            id: true,
            points: true,
            image: true,
            username: true,
            header: true,
          },
        },
        outgoingUser: {
          columns: {
            id: true,
            points: true,
            image: true,
            username: true,
            header: true,
          },
        },
      },
    });

    const friends = friendshipResults.map((friendship) => ({
      friend:
        friendship.incomingId == res.locals.userId
          ? {
              ...friendship.outgoingUser,
              rank: findRank(friendship.outgoingUser.points),
            }
          : {
              ...friendship.incomingUser,
              rank: findRank(friendship.incomingUser.points),
            },
      status: friendship.status,
      outgoingId: friendship.outgoingId,
      incomingId: friendship.incomingId,
      createdAt: friendship.createdAt,
      updatedAt: friendship.updatedAt,
    }));

    res.json(friends);
  } catch (error) {
    handleError(error, res, "Friendships route");
  }
});

friendshipsRoute.post("/friendships", authMiddleware, async (req, res) => {
  try {
    const { incomingId } = req.body as {
      incomingId: string | undefined;
    };

    if (incomingId == undefined) {
      res.status(400).json({
        error: "Invalid request body",
      });
      return;
    }

    const existingFriendship = await db.query.friendship.findFirst({
      where: and(
        eq(friendship.outgoingId, res.locals.userId!),
        eq(friendship.incomingId, incomingId)
      ),
    });

    if (existingFriendship) {
      res
        .status(400)
        .json({ error: "You cannot send multiple friend requests" });
      return;
    }

    const newFriendRequest = await db.insert(friendship).values({
      incomingId,
      outgoingId: res.locals.userId!,
    });

    invalidateQueries(
      ["friendships", incomingId],
      ["friendships", res.locals.userId!]
    );

    const outgoingUser = await db.query.user.findFirst({
      where: eq(user.id, res.locals.userId!),
      columns: {
        id: true,
        image: true,
        username: true,
      },
    });

    io.of("/realtime")
      .to(`user:${incomingId}`)
      .emit("friend-request-received", outgoingUser);

    res.json(newFriendRequest);
  } catch (error) {
    handleError(error, res, "Friendships route");
  }
});

friendshipsRoute.delete("/friendships", authMiddleware, async (req, res) => {
  try {
    const otherId = req.query.otherId as string | undefined;

    if (!otherId) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const friendshipResult = await db.query.friendship.findFirst({
      where: or(
        and(
          eq(friendship.incomingId, otherId),
          eq(friendship.outgoingId, res.locals.userId!)
        ),
        and(
          eq(friendship.incomingId, res.locals.userId!),
          eq(friendship.outgoingId, otherId)
        )
      ),
    });

    if (!friendshipResult) {
      res.status(400).json({ error: "Invalid request, no friendship found" });
      return;
    }

    await db
      .delete(friendship)
      .where(
        and(
          eq(friendship.incomingId, friendshipResult.incomingId),
          eq(friendship.outgoingId, friendshipResult.outgoingId)
        )
      );

    await db
      .update(friendlyMatchRequest)
      .set({
        status: "declined",
      })
      .where(
        or(
          and(
            eq(friendlyMatchRequest.incomingId, friendshipResult.incomingId),
            eq(friendlyMatchRequest.outgoingId, friendshipResult.outgoingId)
          ),
          and(
            eq(friendlyMatchRequest.incomingId, friendshipResult.outgoingId),
            eq(friendlyMatchRequest.outgoingId, friendshipResult.incomingId)
          )
        )
      );

    invalidateQueries(
      ["friendships", friendshipResult.incomingId],
      ["friendships", friendshipResult.outgoingId],
      ["friendly-match-requests", friendshipResult.incomingId],
      ["friendly-match-requests", friendshipResult.outgoingId]
    );

    res.status(200);
  } catch (error) {
    handleError(error, res, "Friendships route");
  }
});

friendshipsRoute.patch("/friendships", authMiddleware, async (req, res) => {
  try {
    const { outgoingId } = req.body as {
      outgoingId: string | undefined;
    };

    if (outgoingId == undefined) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const updatedFriendship = await db
      .update(friendship)
      .set({
        status: "accepted",
      })
      .where(
        and(
          eq(friendship.outgoingId, outgoingId),
          eq(friendship.incomingId, res.locals.userId!)
        )
      );

    invalidateQueries(
      ["friendships", outgoingId],
      ["friendships", res.locals.userId!]
    );

    const incomingUser = await db.query.user.findFirst({
      where: eq(user.id, res.locals.userId!),
      columns: {
        id: true,
        image: true,
        username: true,
      },
    });

    io.of("/realtime")
      .to(`user:${outgoingId}`)
      .emit("friend-request-accepted", incomingUser);

    res.json(updatedFriendship);
  } catch (error) {
    handleError(error, res, "Friendships route");
  }
});
