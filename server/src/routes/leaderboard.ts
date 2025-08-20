import { desc } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { user } from "../db/schema";
import { authMiddleware } from "../middleware";
import { findRank } from "../utils/findRank";
import { handleError } from "../utils/handleError";
import { calculateProgression } from "../utils/calculateProgression";
import { ranks } from "../types/ranks";

export const leaderboardRoute = Router();

leaderboardRoute.get("/leaderboard", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(
      1,
      Math.min(50, parseInt(req.query.page as string) || 1)
    );
    const limit = 10;
    const offset = (page - 1) * limit;

    const [usersResult, totalCountResult] = await Promise.all([
      db.query.user.findMany({
        columns: {
          id: true,
          username: true,
          displayUsername: true,
          image: true,
          points: true,
        },
        with: {
          matchUsers: {
            columns: {
              status: true,
            },
          },
        },
        orderBy: [desc(user.points)],
        limit,
        offset,
        where: (user, { gte }) => gte(user.points, 0),
      }),
      db.query.user.findMany({
        columns: { id: true },
        orderBy: [desc(user.points)],
        limit: 500,
        where: (user, { gte }) => gte(user.points, 0),
      }),
    ]);

    const totalUsers = totalCountResult.length;
    const totalPages = Math.ceil(Math.min(totalUsers, 500) / limit);

    const usersWithRankAndPosition = usersResult.map((userEntry, index) => {
      const rank = findRank(userEntry.points)!;

      return {
        ...userEntry,
        rank,
        progression: calculateProgression(userEntry.points),
        points:
          rank.tier == "Legend"
            ? Math.round(userEntry.points - ranks[ranks.length - 1].minPoints)
            : undefined,
        position: offset + index + 1,
        wins: userEntry.matchUsers.filter(
          (matchUser) => matchUser.status == "win"
        ).length,
      };
    });

    res.json({
      users: usersWithRankAndPosition,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    handleError(error, res, "Leaderboard route");
  }
});
