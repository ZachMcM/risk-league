import { and, eq, ilike, ne } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { user } from "../db/schema";
import { logger } from "../logger";
import { authMiddleware } from "../middleware";
import { calculateProgression } from "../utils/calculateProgression";
import { findNextRank } from "../utils/findNextRank";
import { findRank } from "../utils/findRank";
import { getMaxKey } from "../utils/getMaxKey";

export const usersRoute = Router();

usersRoute.get("/users", authMiddleware, async (req, res) => {
  try {
    const searchQuery = (req.query.searchQuery as string | undefined) || "";

    if (!searchQuery) {
      res.json([]);
      return;
    }

    const usersResults = await db.query.user.findMany({
      where: and(
        ilike(user.username, `%${searchQuery}%`),
        ne(user.id, res.locals.userId!)
      ),
      columns: {
        id: true,
        username: true,
        image: true,
        points: true,
      },
      limit: 10
    });

    res.json(
      usersResults.map((user) => ({
        ...user,
        rank: findRank(user.points),
      }))
    );
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error });
  }
});

usersRoute.get("/users/rank", authMiddleware, async (_, res) => {
  try {
    const userResult = await db.query.user.findFirst({
      columns: {
        id: true,
        username: true,
        image: true,
        points: true,
        header: true,
      },
      where: eq(user.id, res.locals.userId!),
    });

    if (!userResult) {
      res.status(404).json({
        error: "No user was found",
      });
      return;
    }

    const rank = findRank(userResult.points)!;
    const nextRank = findNextRank(userResult.points);

    res.json({
      rank,
      nextRank,
      progression: calculateProgression(userResult.points),
      points: userResult.points,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      error,
    });
  }
});

usersRoute.get("/users/career", authMiddleware, async (_, res) => {
  try {
    const userResult = await db.query.user.findFirst({
      columns: {
        id: true,
        username: true,
        image: true,
        points: true,
        header: true,
      },
      with: {
        matchUsers: {
          columns: {
            status: true,
            pointsDelta: true,
            pointsSnapshot: true,
            createdAt: true,
          },
          with: {
            parlays: {
              columns: {
                resolved: true,
                profit: true,
              },
              with: {
                picks: {
                  columns: {
                    status: true,
                  },
                  with: {
                    prop: {
                      columns: {
                        id: true,
                      },
                      with: {
                        player: {
                          columns: {
                            name: true,
                            id: true,
                          },
                          with: {
                            team: {
                              columns: {
                                fullName: true,
                                id: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            match: {
              columns: {
                type: true,
              },
            },
          },
        },
      },
      where: eq(user.id, res.locals.userId!),
    });

    if (!userResult) {
      res.status(404).json({
        error: "No user was found",
      });
      return;
    }

    const filteredMatchUsers = userResult.matchUsers.filter(
      (matchUser) =>
        matchUser.match.type == "competitive" &&
        matchUser.status != "not_resolved"
    );

    const pointsTimeline: { x: string; y: number }[] = [];

    if (filteredMatchUsers.length > 0) {
      pointsTimeline.push({
        x: filteredMatchUsers[0].createdAt,
        y: filteredMatchUsers[0].pointsSnapshot,
      });
    }

    const pickedPlayers: Map<number, { name: string }> = new Map();
    const pickedPlayersCount: Map<number, number> = new Map();

    const pickedTeams: Map<number, { fullName: string }> = new Map();
    const pickedTeamsCount: Map<number, number> = new Map();

    let peakPoints = userResult.points;

    for (const matchUser of filteredMatchUsers) {
      const pointsAfterMatch = matchUser.pointsSnapshot + matchUser.pointsDelta;
      if (pointsAfterMatch > peakPoints) {
        peakPoints = pointsAfterMatch;
      }

      pointsTimeline.push({ x: matchUser.createdAt, y: pointsAfterMatch });

      for (const parlay of matchUser.parlays) {
        for (const pick of parlay.picks) {
          pickedPlayersCount.set(
            pick.prop.player.id,
            (pickedPlayersCount.get(pick.prop.player.id) || 0) + 1
          );
          if (!pickedPlayers.get(pick.prop.player.id)) {
            pickedPlayers.set(pick.prop.player.id, pick.prop.player);
          }

          pickedTeamsCount.set(
            pick.prop.player.team.id,
            (pickedTeamsCount.get(pick.prop.player.team.id) || 0) + 1
          );

          if (!pickedTeams.get(pick.prop.player.team.id)) {
            pickedTeams.set(pick.prop.player.team.id, pick.prop.player.team);
          }
        }
      }
    }

    const mostBetPlayerId = getMaxKey(pickedPlayersCount);
    const mostBetTeamId = getMaxKey(pickedTeamsCount);

    res.json({
      currentRank: findRank(userResult.points),
      peakRank: findRank(peakPoints),
      pointsTimeline,
      matchStats: {
        total: filteredMatchUsers.filter(
          (matchUser) => matchUser.status != "not_resolved"
        ).length,
        wins: filteredMatchUsers.filter(
          (matchUser) => matchUser.status == "win"
        ).length,
        draws: filteredMatchUsers.filter(
          (matchUser) => matchUser.status == "draw"
        ).length,
        losses: filteredMatchUsers.filter(
          (matchUser) =>
            matchUser.status == "disqualified" || matchUser.status == "loss"
        ).length,
      },
      parlayStats: {
        total: filteredMatchUsers
          .filter((matchUser) => matchUser.status != "not_resolved")
          .reduce(
            (accum, curr) =>
              accum + curr.parlays.filter((parlay) => parlay.resolved).length,
            0
          ),
        wins: filteredMatchUsers
          .filter((matchUser) => matchUser.status != "not_resolved")
          .reduce(
            (accum, curr) =>
              accum +
              curr.parlays.filter(
                (parlay) => parlay.resolved && parlay.profit > 0
              ).length,
            0
          ),
        losses: filteredMatchUsers
          .filter((matchUser) => matchUser.status != "not_resolved")
          .reduce(
            (accum, curr) =>
              accum +
              curr.parlays.filter(
                (parlay) => parlay.resolved && parlay.profit <= 0
              ).length,
            0
          ),
      },
      mostBetPlayer:
        mostBetPlayerId == null
          ? null
          : {
              player: pickedPlayers.get(mostBetPlayerId),
              count: pickedPlayersCount.get(mostBetPlayerId),
            },
      mostBetTeam:
        mostBetTeamId == null
          ? null
          : {
              team: pickedTeams.get(mostBetTeamId),
              count: pickedTeamsCount.get(mostBetTeamId),
            },
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      error,
    });
  }
});
