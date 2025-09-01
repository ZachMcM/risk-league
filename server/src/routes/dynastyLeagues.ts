import {
  and,
  desc,
  eq,
  ilike,
  InferInsertModel,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { Router } from "express";
import { db } from "../db";
import {
  dynastyLeague,
  dynastyLeagueInvitation,
  dynastyLeagueInvitationStatus,
  dynastyLeagueUser,
  message,
} from "../db/schema";
import { authMiddleware } from "../middleware";
import { handleError } from "../utils/handleError";
import { invalidateQueries } from "../utils/invalidateQueries";
import { io } from "..";
import {
  getFlexMultiplier,
  getPerfectPlayMultiplier,
} from "../utils/parlayMultipliers";
import { logger } from "../logger";

export const dynastyLeaguesRoute = Router();

const dynastyLeagueSchema = createInsertSchema(dynastyLeague);

dynastyLeaguesRoute.post(
  "/dynastyLeagues",
  authMiddleware,
  async (req, res) => {
    try {
      const body = req.body as InferInsertModel<typeof dynastyLeague>;

      dynastyLeagueSchema.parse(body);

      if (
        new Date(body.startDate).getTime() > new Date(body.endDate).getTime()
      ) {
        res.status(400).json({ error: "Invalid start and end dates" });
        return;
      }

      if (body.startingBalance < 100) {
        res
          .status(400)
          .json({ error: "Invalid starting balance, must be at least $100" });
        return;
      }

      if (body.title.length > 16 || body.title.length < 1) {
        res.status(400).json({
          error: "Invalid title, must be between 1 and 16 characters inclusive",
        });
        return;
      }

      const [newDynastyLeague] = await db
        .insert(dynastyLeague)
        .values(body)
        .returning({ id: dynastyLeague.id });

      await db.insert(dynastyLeagueUser).values({
        userId: res.locals.userId!,
        role: "manager",
        startingBalance: body.startingBalance,
        balance: body.startingBalance,
        dynastyLeagueId: newDynastyLeague.id,
      });

      invalidateQueries(["dynasty-leagues", res.locals.userId!]);

      res.json({ dynastyLeagueId: newDynastyLeague.id });
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.get(
  "/dynastyLeagues/invites",
  authMiddleware,
  async (_, res) => {
    try {
      const invites = await db.query.dynastyLeagueInvitation.findMany({
        where: and(
          eq(dynastyLeagueInvitation.incomingId, res.locals.userId!),
          eq(dynastyLeagueInvitation.status, "pending")
        ),
        with: {
          dynastyLeague: {
            with: {
              dynastyLeagueUsers: {
                columns: {
                  id: true,
                  userId: true,
                },
              },
            },
          },
          incomingUser: {
            columns: {
              id: true,
              username: true,
              image: true,
              banner: true,
            },
          },
          outgoingUser: {
            columns: {
              id: true,
              username: true,
              image: true,
              points: true,
              banner: true,
            },
          },
        },
      });

      res.json(
        invites.map((invite) => ({
          ...invite,
          dynastyLeague: {
            ...invite.dynastyLeague,
            userCount: invite.dynastyLeague.dynastyLeagueUsers.length,
          },
        }))
      );
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.post(
  "/dynastyLeagues/:id/join",
  authMiddleware,
  async (req, res) => {
    try {
      const dynastyLeagueId = parseInt(req.params.id);

      if (isNaN(dynastyLeagueId)) {
        res.status(400).json({ error: "Invalid dynastyLeagueId" });
        return;
      }

      const memberExists = await db.query.dynastyLeagueUser.findFirst({
        where: and(
          eq(dynastyLeagueUser.userId, res.locals.userId!),
          eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
        ),
      });

      if (memberExists) {
        res.status(409).json({ error: "You are already a member" });
        return;
      }

      logger.debug(dynastyLeagueId);

      const dynastyLeagueResult = await db.query.dynastyLeague.findFirst({
        where: and(
          eq(dynastyLeague.id, dynastyLeagueId),
          eq(dynastyLeague.resolved, false)
        ),
        with: {
          dynastyLeagueUsers: {
            columns: {
              id: true,
              userId: true,
            },
          },
        },
      });

      if (!dynastyLeagueResult) {
        logger.debug("HEre");
        res
          .status(404)
          .json({ error: "No Dynasty League with that id exists" });
        return;
      }

      if (dynastyLeagueResult.dynastyLeagueUsers.length == 50) {
        res.status(409).json({ error: "League is already full" });
        return;
      }

      if (dynastyLeagueResult.inviteOnly) {
        res.status(409).json({ error: "League is invite only" });
        return;
      }

      await db.insert(dynastyLeagueUser).values({
        userId: res.locals.userId!,
        startingBalance: dynastyLeagueResult.startingBalance,
        balance: dynastyLeagueResult.startingBalance,
        role: "member",
        dynastyLeagueId,
      });

      invalidateQueries(
        ["dynasty-leagues", res.locals.userId!],
        ["dynasty-league", dynastyLeagueId],
        ["dynasty-league", dynastyLeagueId, "users"]
      );

      res.json({ success: true });
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.patch(
  "/dynastyLeagues/invite/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const inviteId = parseInt(req.params.id);

      if (isNaN(inviteId)) {
        res.status(400).json({ error: "Invalid inviteId" });
        return;
      }

      const newStatus = req.body.newStatus as
        | (typeof dynastyLeagueInvitationStatus.enumValues)[number]
        | undefined;

      if (
        !newStatus ||
        !dynastyLeagueInvitationStatus.enumValues.includes(newStatus)
      ) {
        res.status(400).json({ error: "Invalid newStatus" });
        return;
      }

      const [updatedInvite] = await db
        .update(dynastyLeagueInvitation)
        .set({
          status: newStatus,
        })
        .returning({
          outgoingId: dynastyLeagueInvitation.outgoingId,
          incomingId: dynastyLeagueInvitation.incomingId,
          dynastyLeagueId: dynastyLeagueInvitation.dynastyLeagueId,
        });

      invalidateQueries(
        ["dynasty-league-invitations", updatedInvite.incomingId],
        ["dynasty-leagues", updatedInvite.incomingId],
        ["dynasty-league", updatedInvite.dynastyLeagueId],
        ["dynasty-league", updatedInvite.dynastyLeagueId, "users"]
      );

      res.json({ success: true });
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

const dynastyLeagueInvitationSchema = createInsertSchema(
  dynastyLeagueInvitation
);

dynastyLeaguesRoute.post(
  "/dynastyLeagues/invite",
  authMiddleware,
  async (req, res) => {
    try {
      const body = req.body as InferInsertModel<typeof dynastyLeagueInvitation>;

      dynastyLeagueInvitationSchema.parse(body);

      if (body.outgoingId != res.locals.userId) {
        res.status(401).json({ error: "You cannot send an invitation" });
        return;
      }

      const dynastyLeagueResult = await db.query.dynastyLeague.findFirst({
        where: and(
          eq(dynastyLeague.id, body.dynastyLeagueId),
          eq(dynastyLeague.resolved, false)
        ),
      });

      if (!dynastyLeagueResult) {
        res.status(400).json({ error: "Invalid dynastyLeagueId" });
        return;
      }

      const existingInvite = await db.query.dynastyLeagueInvitation.findFirst({
        where: and(
          eq(dynastyLeagueInvitation.outgoingId, body.outgoingId),
          eq(dynastyLeagueInvitation.incomingId, body.incomingId),
          or(
            eq(dynastyLeagueInvitation.status, "accepted"),
            eq(dynastyLeagueInvitation.status, "pending")
          )
        ),
      });

      if (existingInvite) {
        res.status(409).json({ error: "You already sent an invitation" });
        return;
      }

      if (dynastyLeagueResult.inviteOnly) {
        const dynastyLeagueUserResult =
          await db.query.dynastyLeagueUser.findFirst({
            where: and(
              eq(dynastyLeagueUser.dynastyLeagueId, body.dynastyLeagueId),
              eq(dynastyLeagueUser.userId, res.locals.userId!),
              eq(dynastyLeagueUser.role, "manager")
            ),
          });

        if (!dynastyLeagueUserResult) {
          res
            .status(401)
            .json({ error: "You are unauthorized to send invites" });
          return;
        }
      }

      await db.insert(dynastyLeagueInvitation).values(body);

      invalidateQueries(["dynasty-league-invitations", body.incomingId]);

      res.json({ success: true });
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.get(
  "/dynastyLeagues/:id/users",
  authMiddleware,
  async (req, res) => {
    try {
      const dynastyLeagueId = parseInt(req.params.id);
      if (isNaN(dynastyLeagueId)) {
        res.status(400).json({ error: "Invalid dynastyLeagueId" });
        return;
      }

      const dynastyLeagueUsersResult =
        await db.query.dynastyLeagueUser.findMany({
          where: eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId),
          with: {
            user: {
              columns: {
                id: true,
                image: true,
                banner: true,
                username: true,
              },
            },
            parlays: {
              with: {
                picks: true,
              },
            },
          },
          orderBy: desc(dynastyLeagueUser.balance),
        });

      const extendedLeagueUsers = dynastyLeagueUsersResult.map((du) => ({
        ...du,
        totalStaked: du.parlays.reduce((accum, curr) => accum + curr.stake, 0),
        totalParlays: du.parlays.length,
        parlaysWon: du.parlays.filter(
          (parlay) => parlay.profit && parlay.profit > 0
        ).length,
        parlaysLost: du.parlays.filter(
          (parlay) => parlay.profit && parlay.profit < 0
        ).length,
        parlaysInProgress: du.parlays.filter((parlay) => !parlay.resolved)
          .length,
        payoutPotential: du.parlays
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
      }));

      res.json(extendedLeagueUsers);
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.get(
  "/dynastyLeagues/:id/messages",
  authMiddleware,
  async (req, res) => {
    try {
      const dynastyLeagueId = req.params.id;

      const messages = await db.query.message.findMany({
        where: eq(message.dynastyLeagueId, parseInt(dynastyLeagueId)),
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
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.post(
  "/dynastyLeagues/:id/messages",
  authMiddleware,
  async (req, res) => {
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
          dynastyLeagueId: parseInt(req.params.id),
        })
        .returning({ id: message.id });

      invalidateQueries([
        "dynasty-league",
        parseInt(req.params.id),
        "messages",
      ]);

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

      const dynastyLeagueUsers = await db.query.dynastyLeagueUser.findMany({
        where: eq(dynastyLeagueUser.dynastyLeagueId, parseInt(req.params.id)),
        columns: {
          userId: true,
        },
      });

      for (const user of dynastyLeagueUsers) {
        io.of("/realtime")
          .to(`user:${user.userId}`)
          .emit("dynasty-league-message-received", messageWithUser);
      }

      res.json(newMessage.id);
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.get(
  "/dynastyLeagues/search",
  authMiddleware,
  async (req, res) => {
    try {
      const query = (req.query.query as string | undefined) || "";

      if (!query || query.trim().length == 0) {
        res.json([]);

        return;
      }

      const leagues = ["MLB", "NBA", "NFL", "NCAAFB", "NCAABB"] as const;
      const matchingLeagues = leagues.filter((league) =>
        league.toLowerCase().includes(query.toLowerCase())
      );

      const dynastyResults = await db.query.dynastyLeague.findMany({
        where: and(
          or(
            ilike(dynastyLeague.title, `%${query}%`),
            sql`exists(select 1 from unnest(${
              dynastyLeague.tags
            }) as tag where tag ilike ${`%${query}%`})`,
            ...matchingLeagues.map((league) => eq(dynastyLeague.league, league))
          ),
          eq(dynastyLeague.resolved, false),
          eq(dynastyLeague.inviteOnly, false)
        ),
        with: {
          dynastyLeagueUsers: {
            columns: { id: true, userId: true },
          },
        },
      });

      const resultsWithCount = dynastyResults.map((league) => ({
        ...league,
        userCount: league.dynastyLeagueUsers.length,
      }));

      res.json(resultsWithCount);
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.get(
  "/dynastyLeagues/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const dynastyLeagueId = parseInt(req.params.id);
      if (isNaN(dynastyLeagueId)) {
        res.status(400).json({ error: "Invalid dynastyLeagueId" });
        return;
      }

      const dynastyLeagueResult = await db.query.dynastyLeague.findFirst({
        where: and(eq(dynastyLeague.id, dynastyLeagueId)),
        with: {
          dynastyLeagueUsers: {
            columns: { id: true, userId: true },
          },
        },
      });

      if (!dynastyLeagueResult) {
        res.status(404).json({ error: "Dynasty league user not found" });
        return;
      }

      res.json({
        ...dynastyLeagueResult,
        userCount: dynastyLeagueResult.dynastyLeagueUsers.length,
      });
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.get("/dynastyLeagues", authMiddleware, async (req, res) => {
  try {
    const dynastyLeagueUserResults = await db.query.dynastyLeagueUser.findMany({
      where: eq(dynastyLeagueUser.userId, res.locals.userId!),
      with: {
        dynastyLeague: {
          with: {
            dynastyLeagueUsers: {
              columns: { id: true, role: true, userId: true },
            },
          },
        },
      },
    });

    const formattedDynastyLeagues = dynastyLeagueUserResults.map(
      ({ dynastyLeague }) => ({
        ...dynastyLeague,
        userCount: dynastyLeague.dynastyLeagueUsers.length,
      })
    );

    res.json(formattedDynastyLeagues);
  } catch (error) {
    handleError(error, res, "Dynasty Leagues");
  }
});
