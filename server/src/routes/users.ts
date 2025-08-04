import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { user } from "../db/schema";
import { authMiddleware } from "../middleware";
import { getRank } from "../utils/getRank";
import { findRank } from "../utils/findRank";
import { number } from "better-auth/*";
import { getMaxKey } from "../utils/getMaxKey";
import { findNextRank } from "../utils/findNextRank";

export const usersRoute = Router();

usersRoute.get("/users/:id", authMiddleware, async (_, res) => {
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
      ...userResult,
      rank,
      nextRank,
      progressToNextTrank: nextRank
        ? Math.round(
            ((nextRank.minPoints - userResult.points) /
              (nextRank.minPoints - rank.minPoints)) *
              100
          )
        : 0,
    });
  } catch (err) {
    res.status(500).json({
      error: "Server Error",
    });
  }
});

usersRoute.get("/users/:id/career", authMiddleware, async (_, res) => {
  try {
    const userResult = await db.query.user.findFirst({
      columns: {
        id: true,
        username: true,
        image: true,
        points: true,
        header: true,
        peakPoints: true,
      },
      with: {
        matchUsers: {
          columns: {
            status: true,
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
                            position: true,
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

    const pickedPlayers: Map<number, { name: string; position: string }> =
      new Map();
    const pickedPlayersCount: Map<number, number> = new Map();

    const pickedTeams: Map<number, { id: number; fullName: string }> =
      new Map();
    const pickedTeamsCount: Map<number, number> = new Map();

    for (const matchUser of userResult.matchUsers) {
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

    res.json({
      peakRank: findRank(userResult.peakPoints),
      matchStats: {
        total: userResult.matchUsers.filter(
          (matchUser) => matchUser.status != "not_resolved"
        ).length,
        wins: userResult.matchUsers.filter(
          (matchUser) => matchUser.status == "win"
        ).length,
        draws: userResult.matchUsers.filter(
          (matchUser) => matchUser.status == "draw"
        ).length,
        losses: userResult.matchUsers.filter(
          (matchUser) =>
            matchUser.status == "disqualified" || matchUser.status == "loss"
        ),
      },
      parlayStats: {
        total: userResult.matchUsers
          .filter((matchUser) => matchUser.status != "not_resolved")
          .reduce(
            (accum, curr) =>
              accum + curr.parlays.filter((parlay) => parlay.resolved).length,
            0
          ),
        wins: userResult.matchUsers
          .filter((matchUser) => matchUser.status != "not_resolved")
          .reduce(
            (accum, curr) =>
              accum +
              curr.parlays.filter(
                (parlay) => parlay.resolved && parlay.profit > 0
              ).length,
            0
          ),
        losses: userResult.matchUsers
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
      mostBetPlayer: {
        player: pickedPlayers.get(getMaxKey(pickedPlayersCount)),
        numParlays: pickedPlayersCount.get(getMaxKey(pickedPlayersCount)),
      },
      mostBetTeam: {
        team: pickedTeams.get(getMaxKey(pickedTeamsCount)),
        numParlays: pickedTeamsCount.get(getMaxKey(pickedTeamsCount)),
      },
    });
  } catch (err) {
    res.status(500).json({
      error: "Server Error",
    });
  }
});
