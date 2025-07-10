import { Router } from "express";
import { authMiddleware } from "./auth";
import { db } from "../db/db";
import { logger } from "../logger";

export const matchesRoute = Router();

matchesRoute.get("/matches", authMiddleware, async (req, res) => {
  const userId = res.locals.userId;

  try {
 

  } catch (err) {
    logger.error(err);
    res.status(500).json({ err: "Server Error", message: err });
  }
});

matchesRoute.get("/matches/:id", authMiddleware, async (req, res) => {
  const matchId = req.params.id;

  try {
    const rows = await db
      .selectFrom("matches")
      .leftJoin("match_users", "matches.id", "match_users.match_id")
      .leftJoin("users", "match_users.user_id", "users.id")
      .select([
        "matches.id",
        "matches.created_at",
        "matches.resolved",
        "match_users.id as match_user_id",
        "match_users.balance",
        "match_users.elo_delta",
        "match_users.status as match_status",
        "users.id as user_id",
        "users.username",
        "users.email",
        "users.image",
        "users.elo_rating",
      ])
      .where("matches.id", "=", matchId)
      .executeTakeFirstOrThrow();
  } catch (err: any) {
    logger.error(err);
    res.status(500).json({ error: "Server Error", message: err });
  }
});

matchesRoute.get("/matches/:id/messages", authMiddleware, async (req, res) => {
  const matchId = req.params.id;

  try {
    const messages = await db
      .selectFrom("match_messages")
      .innerJoin("users", "users.id", "match_messages.user_id")
      .select([
        "content",
        "match_messages.created_at as createdAt",
        "user_id as userId",
        "username",
        "users.image as image",
      ])
      .where("match_messages.match_id", "=", matchId)
      .orderBy("match_messages.created_at", "asc")
      .execute();

    res.json(messages);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Server Error", message: err });
  }
});
