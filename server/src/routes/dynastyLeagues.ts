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
} from "../db/schema";
import { authMiddleware } from "../middleware";
import { handleError } from "../utils/handleError";
import { invalidateQueries } from "../utils/invalidateQueries";

export const dynastyLeaguesRoute = Router();

const dynastyLeagueSchema = createInsertSchema(dynastyLeague);

dynastyLeaguesRoute.post(
  "/dynastyLeagues",
  authMiddleware,
  async (req, res) => {
    try {
      const body = req.body as InferInsertModel<typeof dynastyLeague>;

      dynastyLeagueSchema.parse(body);

      if (body.startDate > body.endDate) {
        res.json({ error: "Invalid start and end dates" });
        return;
      }

      if (body.startingBalance < 100) {
        res.json({ error: "Invalid starting balance, must be at least $100" });
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

      invalidateQueries(["dynasty-leagues", res.locals.userId!, "unresolved"]);

      res.json({ success: true });
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.get(
  "dynastyLeagues/invites",
  authMiddleware,
  async (req, res) => {
    try {
      const invites = await db.query.dynastyLeagueInvitation.findMany({
        where: and(
          eq(dynastyLeagueInvitation.incomingId, res.locals.userId!),
          eq(dynastyLeagueInvitation.status, "pending")
        ),
      });

      res.json(invites);
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

      const dynastyLeagueResult = await db.query.dynastyLeague.findFirst({
        where: eq(dynastyLeague.id, dynastyLeagueId),
        with: {
          dynastyLeagueUsers: {
            columns: {
              id: true,
            },
          },
        },
      });

      if (!dynastyLeagueResult) {
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
        ["dynasty-leagues", res.locals.userId!, "unresolved"],
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
        ["dynasty-leagues", updatedInvite.incomingId, "unresolved"],
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
        where: eq(dynastyLeague.id, body.dynastyLeagueId),
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
          },
          orderBy: desc(dynastyLeagueUser.balance),
        });

      res.json(dynastyLeagueUsersResult);
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

      const dynastyLeagueUserResult =
        await db.query.dynastyLeagueUser.findFirst({
          where: and(
            eq(dynastyLeagueUser.userId, res.locals.userId!),
            eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
          ),
          with: {
            dynastyLeague: true,
          },
        });

      if (!dynastyLeagueUserResult) {
        res.status(404).json({ error: "Dynasty league user not found" });
        return;
      }

      res.json(dynastyLeagueUserResult);
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

      if (!query) {
        res.json([]);

        return;
      }

      const dynastyResults = await db.query.dynastyLeague.findMany({
        where: or(
          ilike(dynastyLeague.title, `%${query}%`),
          sql`exists(select 1 from unnest(${
            dynastyLeague.tags
          }) as tag where tag ilike ${`%${query}%`})`
        ),
      });

      res.json(dynastyResults);
    } catch (error) {
      handleError(error, res, "Dynasty Leagues");
    }
  }
);

dynastyLeaguesRoute.get("/dynastyLeagues", authMiddleware, async (req, res) => {
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
      const dynastyLeagueUserResults =
        await db.query.dynastyLeagueUser.findMany({
          where: and(
            eq(dynastyLeagueUser.userId, res.locals.userId!),
            isNull(dynastyLeagueUser.placement)
          ),
          with: {
            dynastyLeague: {
              with: {
                dynastyLeagueUsers: {
                  columns: { id: true, role: true },
                },
              },
            },
          },
        });

      const formattedDynastyLeagues = dynastyLeagueUserResults.map(
        ({ dynastyLeague }) => dynastyLeague
      );

      res.json({ formattedDynastyLeagues });
      return;
    }

    const dynastyLeagueUserResults = await db.query.dynastyLeagueUser.findMany({
      where: and(
        eq(dynastyLeagueUser.userId, res.locals.userId!),
        isNotNull(dynastyLeagueUser.placement)
      ),
      with: {
        dynastyLeague: {
          with: {
            dynastyLeagueUsers: {
              columns: { id: true, role: true },
            },
          },
        },
      },
    });

    const formattedDynastyLeagues = dynastyLeagueUserResults.map(
      ({ dynastyLeague }) => dynastyLeague
    );

    res.json({ formattedDynastyLeagues });
  } catch (error) {
    handleError(error, res, "Dynasty Leagues");
  }
});
