import {
  and,
  desc,
  eq,
  gt,
  ilike,
  InferInsertModel,
  or,
  sql,
} from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { Router } from "express";
import { io } from "..";
import { db } from "../db";
import {
  dynastyLeague,
  dynastyLeagueInvitation,
  dynastyLeagueUser,
  message,
} from "../db/schema";
import { authMiddleware } from "../middleware";
import { handleError } from "../utils/handleError";
import { invalidateQueries } from "../utils/invalidateQueries";
import { sendPushNotifications } from "../pushNotifications";
import {
  getFlexMultiplier,
  getPerfectPlayMultiplier,
} from "../utils/parlayMultipliers";

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

      if (body.title.length > 32 || body.title.length < 1) {
        res.status(400).json({
          error: "Invalid title, must be between 1 and 32 characters inclusive",
        });
        return;
      }

      const [newDynastyLeague] = await db
        .insert(dynastyLeague)
        .values(body)
        .returning({ id: dynastyLeague.id });

      await db.insert(dynastyLeagueUser).values({
        userId: res.locals.userId!,
        role: "owner",
        startingBalance: body.startingBalance,
        balance: body.startingBalance,
        dynastyLeagueId: newDynastyLeague.id,
      });
      res.json({ id: newDynastyLeague.id });
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.post(
  "/dynastyLeagues/:id/invite",
  authMiddleware,
  async (req, res) => {
    try {
      const dynastyLeagueId = parseInt(req.params.id);

      if (isNaN(dynastyLeagueId)) {
        res.status(400).json({ error: "Invalid dynastyLeagueId" });
        return;
      }

      const dynastyLeagueResult = await db.query.dynastyLeague.findFirst({
        where: and(
          eq(dynastyLeague.id, dynastyLeagueId),
          gt(dynastyLeague.endDate, new Date().toISOString())
        ),
      });

      if (!dynastyLeagueResult) {
        res.status(409).json({ error: "No available dynastyLeague found" });
        return;
      }

      const admin = await db.query.dynastyLeagueUser.findFirst({
        where: and(
          or(
            eq(dynastyLeagueUser.role, "manager"),
            eq(dynastyLeagueUser.role, "owner")
          ),
          eq(dynastyLeagueUser.userId, res.locals.userId!),
          eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
        ),
      });

      if (!admin) {
        res.status(401).json({
          error: "You do not have invite permissions for this league",
        });
        return;
      }

      const [newInvite] = await db
        .insert(dynastyLeagueInvitation)
        .values({
          dynastyLeagueId,
        })
        .returning({ id: dynastyLeagueInvitation.id });

      res.json(newInvite);
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

      const dynastyLeagueResult = await db.query.dynastyLeague.findFirst({
        where: and(
          eq(dynastyLeague.id, dynastyLeagueId),
          gt(dynastyLeague.endDate, new Date().toISOString())
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
        res.status(409).json({ error: "No available dynastyLeague found" });
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

      if (
        dynastyLeagueResult.dynastyLeagueUsers.length ==
        dynastyLeagueResult.maxUsers
      ) {
        res.status(409).json({ error: "League is already full" });
        return;
      }

      if (dynastyLeagueResult.inviteOnly) {
        if (req.query.inviteId) {
          const invite = await db.query.dynastyLeagueInvitation.findFirst({
            where: and(
              eq(dynastyLeagueInvitation.id, req.query.inviteId as string),
              eq(dynastyLeagueInvitation.dynastyLeagueId, dynastyLeagueId)
            ),
          });

          if (!invite) {
            res.status(409).json({
              error: "You do not have the permissions to join this league",
            });
            return;
          }
        }
      }

      await db.insert(dynastyLeagueUser).values({
        userId: res.locals.userId!,
        startingBalance: dynastyLeagueResult.startingBalance,
        balance: dynastyLeagueResult.startingBalance,
        role: "member",
        dynastyLeagueId,
      });

      invalidateQueries(
        ["dynasty-league-ids", res.locals.userId!],
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
  "/dynastyLeagues/:id/users/bonus",
  authMiddleware,
  async (req, res) => {
    try {
      const dynastyLeagueId = parseInt(req.params.id);

      if (isNaN(dynastyLeagueId)) {
        res.status(400).json({ error: "Invalid dynastyLeagueId" });
        return;
      }

      const dynastyLeagueResult = await db.query.dynastyLeague.findFirst({
        where: and(
          eq(dynastyLeague.id, dynastyLeagueId),
          gt(dynastyLeague.endDate, new Date().toISOString())
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
        res.status(409).json({ error: "No available dynastyLeague found" });
        return;
      }

      const isOwner = await db.query.dynastyLeagueUser.findFirst({
        where: and(
          eq(dynastyLeagueUser.userId, res.locals.userId!),
          eq(dynastyLeagueUser.role, "owner"),
          eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
        ),
      });

      if (!isOwner) {
        res.status(401).json({ error: "Only league owners can add bonuses" });
        return;
      }

      const bonusValue = req.body.bonusValue as number | undefined;

      if (bonusValue == undefined || bonusValue <= 0) {
        res
          .status(400)
          .json({ error: "Bonus value must be a positive number" });
        return;
      }

      // Update all users' balances in the league
      await db
        .update(dynastyLeagueUser)
        .set({
          balance: sql`balance + ${bonusValue}`,
        })
        .where(eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId));

      // Invalidate relevant queries
      invalidateQueries(
        ["dynasty-league", dynastyLeagueId, "users"],
        ["dynasty-league", dynastyLeagueId]
      );

      res.json({ success: true });
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.delete(
  "/dynastyLeagues/:dynastyLeagueId/users/:userId/kick",
  authMiddleware,
  async (req, res) => {
    try {
      const dynastyLeagueId = parseInt(req.params.dynastyLeagueId);
      if (isNaN(dynastyLeagueId)) {
        res.status(400).json({ error: "Invalid dynastyLeagueId" });
        return;
      }

      const dynastyLeagueResult = await db.query.dynastyLeague.findFirst({
        where: and(
          eq(dynastyLeague.id, dynastyLeagueId),
          gt(dynastyLeague.endDate, new Date().toISOString())
        ),
      });

      if (!dynastyLeagueResult) {
        res.status(409).json({ error: "No available dynastyLeague found" });
        return;
      }

      const admin = await db.query.dynastyLeagueUser.findFirst({
        where: and(
          or(
            eq(dynastyLeagueUser.role, "manager"),
            eq(dynastyLeagueUser.role, "owner")
          ),
          eq(dynastyLeagueUser.userId, res.locals.userId!),
          eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
        ),
      });

      if (!admin) {
        res
          .status(401)
          .json({ error: "You do not have the permissions to kick this user" });
        return;
      }

      const userId = req.params.userId;

      const [deletedUser] = await db
        .delete(dynastyLeagueUser)
        .where(
          and(
            eq(dynastyLeagueUser.role, "member"),
            eq(dynastyLeagueUser.userId, userId),
            eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
          )
        )
        .returning({ id: dynastyLeagueUser.userId });

      if (!deletedUser) {
        res
          .status(401)
          .json({ error: "You do not have the permissions to kick this user" });
        return;
      }

      invalidateQueries(
        ["dynasty-league-ids", userId],
        ["dynasty-league", dynastyLeagueId, "users"],
        ["dynasty-league", dynastyLeagueId]
      );

      res.json({ success: true });
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.patch(
  "/dynastyLeagues/:dynastyLeagueId/users/:userId/promote",
  authMiddleware,
  async (req, res) => {
    try {
      const dynastyLeagueId = parseInt(req.params.dynastyLeagueId);
      if (isNaN(dynastyLeagueId)) {
        res.status(400).json({ error: "Invalid dynastyLeagueId" });
        return;
      }

      const dynastyLeagueResult = await db.query.dynastyLeague.findFirst({
        where: and(
          eq(dynastyLeague.id, dynastyLeagueId),
          gt(dynastyLeague.endDate, new Date().toISOString())
        ),
      });

      if (!dynastyLeagueResult) {
        res.status(409).json({ error: "No available dynastyLeague found" });
        return;
      }

      const admin = await db.query.dynastyLeagueUser.findFirst({
        where: and(
          or(
            eq(dynastyLeagueUser.role, "manager"),
            eq(dynastyLeagueUser.role, "owner")
          ),
          eq(dynastyLeagueUser.userId, res.locals.userId!),
          eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
        ),
      });

      if (!admin) {
        res
          .status(401)
          .json({ error: "You do not have the permissions to kick this user" });
        return;
      }

      const userId = req.params.userId;

      const [promotedUser] = await db
        .update(dynastyLeagueUser)
        .set({
          role: "manager",
        })
        .where(
          and(
            eq(dynastyLeagueUser.role, "member"),
            eq(dynastyLeagueUser.userId, userId),
            eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
          )
        )
        .returning({ id: dynastyLeagueUser.userId });

      if (!promotedUser) {
        res
          .status(401)
          .json({ error: "You do not have the permissions to kick this user" });
        return;
      }

      invalidateQueries(
        ["dynasty-league-ids", userId],
        ["dynasty-league", dynastyLeagueId, "users"],
        ["dynasty-league", dynastyLeagueId]
      );

      res.json({ success: true });
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.patch(
  "/dynastyLeagues/:dynastyLeagueId/users/:userId/demote",
  authMiddleware,
  async (req, res) => {
    try {
      const dynastyLeagueId = parseInt(req.params.dynastyLeagueId);
      if (isNaN(dynastyLeagueId)) {
        res.status(400).json({ error: "Invalid dynastyLeagueId" });
        return;
      }

      const dynastyLeagueResult = await db.query.dynastyLeague.findFirst({
        where: and(
          eq(dynastyLeague.id, dynastyLeagueId),
          gt(dynastyLeague.endDate, new Date().toISOString())
        ),
      });

      if (!dynastyLeagueResult) {
        res.status(409).json({ error: "No available dynastyLeague found" });
        return;
      }

      const owner = await db.query.dynastyLeagueUser.findFirst({
        where: and(
          eq(dynastyLeagueUser.role, "owner"),
          eq(dynastyLeagueUser.userId, res.locals.userId!),
          eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
        ),
      });

      if (!owner) {
        res
          .status(401)
          .json({ error: "You do not have the permissions to kick this user" });
        return;
      }

      const userId = req.params.userId;

      const [demotedUser] = await db
        .update(dynastyLeagueUser)
        .set({
          role: "member",
        })
        .where(
          and(
            eq(dynastyLeagueUser.userId, userId),
            eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
          )
        )
        .returning({ id: dynastyLeagueUser.userId });

      if (!demotedUser) {
        res
          .status(401)
          .json({ error: "You do not have the permissions to kick this user" });
        return;
      }

      invalidateQueries(
        ["dynasty-league-ids", userId],
        ["dynasty-league", dynastyLeagueId, "users"],
        ["dynasty-league", dynastyLeagueId]
      );

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

      const dynastyLeagueResult = await db.query.dynastyLeague.findFirst({
        where: eq(dynastyLeague.id, dynastyLeagueId),
      });

      if (!dynastyLeagueResult) {
        res.status(404).json({ error: "No dynasty league found" });
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

      const extendedLeagueUsers = dynastyLeagueUsersResult.map((du, index) => {
        const totalStaked = du.parlays.reduce(
          (accum, curr) => accum + curr.stake,
          0
        );
        const totalParlays = du.parlays.length;

        return {
          ...du,
          totalStaked,
          totalParlays,
          parlaysWon: du.parlays.filter(
            (parlay) => parlay.payout > 0 && parlay.resolved
          ).length,
          parlaysLost: du.parlays.filter(
            (parlay) => parlay.payout == 0 && parlay.resolved
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
        };
      });

      const sortedExtendedLeagueUsers = extendedLeagueUsers
        .sort((a, b) => {
          const balanceA =
            a.totalParlays >= dynastyLeagueResult.minParlays &&
            a.totalStaked >= dynastyLeagueResult.minTotalStaked
              ? a.balance
              : Infinity;
          const balanceB =
            b.totalParlays >= dynastyLeagueResult.minParlays &&
            b.totalStaked >= dynastyLeagueResult.minTotalStaked
              ? b.balance
              : Infinity;
          return balanceA - balanceB;
        })
        .map((du, index) => ({
          ...du,
          rank:
            du.totalParlays >= dynastyLeagueResult.minParlays &&
            du.totalStaked >= dynastyLeagueResult.minTotalStaked
              ? index + 1
              : null,
        }));

      res.json(sortedExtendedLeagueUsers);
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

      // Send push notifications (exclude sender)
      const recipientIds = dynastyLeagueUsers
        .filter((u) => u.userId !== res.locals.userId!)
        .map((u) => u.userId);

      if (recipientIds.length > 0) {
        sendPushNotifications({
          userIds: recipientIds,
          title: "Dynasty League Message",
          body: `${messageWithUser?.user.username || "Someone"}: ${req.body.content.substring(0, 50)}${req.body.content.length > 50 ? "..." : ""}`,
          data: { dynastyLeagueId: parseInt(req.params.id), url: `/dynastyLeague/${req.params.id}?openSubRoute=messages` },
        });
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
        const adminLeagues = await db.query.dynastyLeague.findMany({
          where: and(
            eq(dynastyLeague.adminCup, true),
            gt(dynastyLeague.endDate, new Date().toISOString())
          ),
          with: {
            dynastyLeagueUsers: {
              columns: { id: true, userId: true },
            },
          },
        });

        res.json(adminLeagues);

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
          gt(dynastyLeague.endDate, new Date().toISOString()),
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

dynastyLeaguesRoute.get("/dynastyLeagues", authMiddleware, async (_, res) => {
  try {
    const dynastyLeagueUserResults = await db.query.dynastyLeagueUser.findMany({
      where: eq(dynastyLeagueUser.userId, res.locals.userId!),
      columns: {
        dynastyLeagueId: true,
      },
      orderBy: desc(dynastyLeagueUser.createdAt),
    });

    const dynastyLeagueIds = dynastyLeagueUserResults.map(
      ({ dynastyLeagueId }) => dynastyLeagueId
    );
    res.json(dynastyLeagueIds);
  } catch (error) {
    handleError(error, res, "Dynasty Leagues");
  }
});
