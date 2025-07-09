import { Router } from "express";
import { authMiddleware } from "./auth";
import { db } from "../db/db";
import { logger } from "../logger";

export const matchesRoute = Router();

matchesRoute.get("/matches", authMiddleware, async (req, res) => {
  const userId = res.locals.userId;

  try {
    const matches = await db
      .selectFrom("match_users as mu")
      .innerJoin("matches as m", "mu.match_id", "m.id")
      .innerJoin("match_users as opponent", "opponent.match_id", "m.id")
      .innerJoin("users as u", "u.id", "opponent.user_id")
      .select([
        "m.id",
        "mu.balance",
        "m.created_at as createdAt",
        "mu.elo_delta as eloDelta",
        "mu.status",
        "u.username as opponentUsername",
        "u.id as opponentId",
        "u.image as opponentImage",
        "opponent.balance as opponentBalance",
      ])
      .where("mu.user_id", "=", userId)
      .where("opponent.user_id", "!=", userId)
      .orderBy("m.created_at", "desc")
      .execute();

    res.json(matches);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ err: "Server Error", message: err });
  }
});

matchesRoute.get("/matches/:id/stats", authMiddleware, async (req, res) => {
  
  const matchId = req.params.id;
  const opponent = req.query.opponent === "true";
  const userId = res.locals.userId;

  logger.debug(opponent)

  try {
    const userStats = await db
      .selectFrom("match_users")
      .innerJoin("users", "users.id", "match_users.user_id")
      .select([
        "image",
        "username",
        "balance",
        "user_id as userId",
        "match_id as matchId",
        "match_users.id as matchUserId",
      ])
      .where("match_id", "=", matchId)
      .where("match_users.user_id", opponent ? "!=" : "=", userId)
      .executeTakeFirstOrThrow();

    logger.debug(userStats);

    const parlayCounts = await db
      .selectFrom("parlays")
      .select(db.fn.countAll().as("totalParlays"))
      .where("parlays.match_user_id", "=", userStats.matchUserId)
      .executeTakeFirstOrThrow();

    res.json({
      ...userStats,
      ...parlayCounts,
    });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ err: "Server Error", message: "Match does not exist" });
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
