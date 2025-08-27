import { Router } from "express";
import { authMiddleware } from "../middleware";
import { db } from "../db";
import { and, eq, or } from "drizzle-orm";
import {
  friendlyMatchRequest,
  friendship,
  leagueType,
  user,
} from "../db/schema";
import { logger } from "../logger";
import { io } from "..";
import { invalidateQueries } from "../utils/invalidateQueries";
import { createMatch } from "../sockets/matchmaking";
import { handleError } from "../utils/handleError";

export const friendlyMatchRequestsRoute = Router();

friendlyMatchRequestsRoute.get(
  "/friendly-match-requests",
  authMiddleware,
  async (_, res) => {
    try {
      const friendlyMatchRequests =
        await db.query.friendlyMatchRequest.findMany({
          where: and(
            or(
              eq(friendlyMatchRequest.incomingId, res.locals.userId!),
              eq(friendlyMatchRequest.outgoingId, res.locals.userId!)
            ),
            eq(friendlyMatchRequest.status, "pending")
          ),
          with: {
            outgoingUser: {
              columns: {
                id: true,
                points: true,
                image: true,
                username: true,
                banner: true,
              },
            },
            incomingUser: {
              columns: {
                id: true,
                points: true,
                image: true,
                username: true,
                banner: true,
              },
            },
          },
        });

      res.json(
        friendlyMatchRequests.map((request) => ({
          id: request.id,
          league: request.league,
          status: request.status,
          outgoingId: request.outgoingId,
          incomingId: request.incomingId,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          friend:
            request.incomingId == res.locals.userId!
              ? request.outgoingUser
              : request.incomingUser,
        }))
      );
    } catch (error) {
      handleError(error, res, "Friendly match requests route");
    }
  }
);

friendlyMatchRequestsRoute.patch(
  "/friendly-match-requests/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);

      const { status } = req.body as {
        status: "accepted" | "declined" | undefined;
      };

      if (status == undefined) {
        res
          .status(400)
          .json({ error: "Invalid request body, missing newStatus" });
        return;
      }

      if (status == "accepted") {
        const existingRequest = await db.query.friendlyMatchRequest.findFirst({
          where: and(
            eq(friendlyMatchRequest.id, requestId),
            eq(friendlyMatchRequest.incomingId, res.locals.userId!)
          ),
        });

        if (!existingRequest) {
          res.status(401).json({
            error:
              "You cannot accept a friendly match request as the outgoing user",
          });
        }
      }

      const [updatedRequest] = await db
        .update(friendlyMatchRequest)
        .set({
          status,
        })
        .where(
          and(
            eq(friendlyMatchRequest.id, requestId),
            or(
              eq(friendlyMatchRequest.incomingId, res.locals.userId!),
              eq(friendlyMatchRequest.outgoingId, res.locals.userId!)
            )
          )
        )
        .returning({
          id: friendlyMatchRequest.id,
          outgoingId: friendlyMatchRequest.outgoingId,
          incomingId: friendlyMatchRequest.incomingId,
          league: friendlyMatchRequest.league,
        });

      if (!updatedRequest) {
        res.status(404).json({ error: "No friendly match request found" });
        return;
      }

      const userResult = await db.query.user.findFirst({
        where: eq(user.id, res.locals.userId!),
        columns: {
          id: true,
          username: true,
          image: true,
        },
      });

      if (status == "declined") {
        invalidateQueries(
          ["friendly-match-requests", updatedRequest.outgoingId],
          ["friendly-match-requests", updatedRequest.incomingId]
        );

        io.of("/realtime")
          .to(
            `user:${
              updatedRequest.incomingId == res.locals.userId
                ? updatedRequest.outgoingId
                : updatedRequest.incomingId
            }`
          )
          .emit("friendly-match-request-declined", {
            ...userResult,
            league: updatedRequest.league,
          });

        res.json(updatedRequest);
        return;
      }

      const newMatchId = await createMatch({
        user1Id: updatedRequest.outgoingId,
        user2Id: updatedRequest.incomingId,
        league: updatedRequest.league,
        type: "friendly",
      });

      invalidateQueries(
        ["matches", updatedRequest.outgoingId, "unresolved"],
        ["matches", updatedRequest.incomingId, "unresolved"],
        ["matches", updatedRequest.outgoingId, "resolved"],
        ["matches", updatedRequest.incomingId, "resolved"],
        ["friendly-match-requests", updatedRequest.outgoingId],
        ["friendly-match-requests", updatedRequest.incomingId]
      );

      for (const userId of [
        updatedRequest.outgoingId,
        updatedRequest.incomingId,
      ]) {
        io.of("/realtime")
          .to(`user:${userId}`)
          .emit("friendly-match-request-accepted", {
            matchId: newMatchId,
          });
      }

      res.json(newMatchId);
    } catch (error) {
      handleError(error, res, "Friendly match requests route");
    }
  }
);

friendlyMatchRequestsRoute.post(
  "/friendly-match-requests",
  authMiddleware,
  async (req, res) => {
    try {
      const { incomingId, league } = req.body as {
        incomingId: string | undefined;
        league: (typeof leagueType.enumValues)[number] | undefined;
      };

      if (incomingId == undefined || league == undefined) {
        res.status(400).json({ error: "Invalid request body" });
        return;
      }

      const friendshipResult = await db.query.friendship.findFirst({
        where: or(
          and(
            eq(friendship.incomingId, incomingId),
            eq(friendship.outgoingId, res.locals.userId!)
          ),
          and(
            eq(friendship.incomingId, res.locals.userId!),
            eq(friendship.outgoingId, incomingId)
          )
        ),
      });

      if (!friendshipResult) {
        res
          .status(400)
          .json({ error: "You can only start friendly matches with friends" });
        return;
      }

      const [newFriendlyMatchRequest] = await db
        .insert(friendlyMatchRequest)
        .values({
          incomingId,
          outgoingId: res.locals.userId!,
          league,
        })
        .returning({ id: friendlyMatchRequest.id });

      invalidateQueries(
        ["friendly-match-requests", incomingId],
        ["friendly-match-requests", res.locals.userId!]
      );

      const userResult = await db.query.user.findFirst({
        where: eq(user.id, res.locals.userId!),
        columns: {
          id: true,
          image: true,
          username: true,
        },
      });

      io.of("/realtime")
        .to(`user:${incomingId}`)
        .emit("friendly-match-request-received", { ...userResult, league });

      res.json(newFriendlyMatchRequest);
    } catch (error) {
      handleError(error, res, "Friendly match requests route");
    }
  }
);
