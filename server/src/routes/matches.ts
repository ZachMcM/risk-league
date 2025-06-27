import { Router } from "express";
import { authMiddleware } from "./auth";
import { db } from "../db/db";
import { getMatchStats } from "../utils/getMatchStats";

export const matchesRoute = Router();

matchesRoute.get("/matches", authMiddleware, async (_, res) => {
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
    console.log(err);
    res.status(500).json({ err: "Server Error", message: err });
  }
});

matchesRoute.get("/matches/:id/stats", authMiddleware, async (req, res) => {
  const matchId = req.params.id;
  const userId = res.locals.userId;

  try {
    const userStats = await getMatchStats(matchId, false, userId);
    const opponentStats = await getMatchStats(matchId, true, userId);

    res.json({
      userStats,
      opponentStats,
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ err: "Server Error", message: "Match does not exist" });
  }
});
