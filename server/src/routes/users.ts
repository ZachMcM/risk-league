import { and, eq, ilike, ne } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { leagueType, user } from "../db/schema";
import { authMiddleware } from "../middleware";
import { calculateProgression } from "../utils/calculateProgression";
import { findNextRank } from "../utils/findNextRank";
import { findRank } from "../utils/findRank";
import { getMaxKey } from "../utils/getMaxKey";
import { handleError } from "../utils/handleError";
import { ranks } from "../types/ranks";

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
        ne(user.id, res.locals.userId!),
      ),
      columns: {
        id: true,
        username: true,
        image: true,
        points: true,
      },
      limit: 10,
    });

    res.json(
      usersResults.map((user) => ({
        ...user,
        rank: findRank(user.points),
      })),
    );
  } catch (error) {
    handleError(error, res, "Users route");
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
      points: rank.tier == "Legend" ? userResult.points - ranks[5].minPoints : undefined,
    });
  } catch (error) {
    handleError(error, res, "Users route");
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
                            playerId: true,
                            league: true,
                          },
                          with: {
                            team: {
                              columns: {
                                fullName: true,
                                teamId: true,
                                league: true,
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
        matchUser.status != "not_resolved",
    );

    const pointsTimeline: { x: string; y: number }[] = [];

    if (filteredMatchUsers.length > 0) {
      pointsTimeline.push({
        x: filteredMatchUsers[0].createdAt,
        y: filteredMatchUsers[0].pointsSnapshot,
      });
    }

    const pickedPlayerCounts: Map<string, number> = new Map();
    const pickedPlayerInfo: Map<
      string,
      {
        playerId: number;
        league: (typeof leagueType.enumValues)[number];
        name: string;
      }
    > = new Map();

    const pickedTeamCounts: Map<string, number> = new Map();
    const pickedTeamInfo: Map<
      string,
      {
        teamId: number;
        league: (typeof leagueType.enumValues)[number];
        fullName: string;
      }
    > = new Map();

    let peakPoints = userResult.points;

    for (const matchUser of filteredMatchUsers) {
      const pointsAfterMatch = matchUser.pointsSnapshot + matchUser.pointsDelta;
      if (pointsAfterMatch > peakPoints) {
        peakPoints = pointsAfterMatch;
      }

      pointsTimeline.push({ x: matchUser.createdAt, y: pointsAfterMatch });

      for (const parlay of matchUser.parlays) {
        for (const pick of parlay.picks) {
          const playerKey = `${pick.prop.player.playerId}-${pick.prop.player.league}`;
          const playerInfo = {
            name: pick.prop.player.name,
            playerId: pick.prop.player.playerId,
            league: pick.prop.player.league,
          };

          pickedPlayerCounts.set(
            playerKey,
            (pickedPlayerCounts.get(playerKey) || 0) + 1,
          );
          pickedPlayerInfo.set(playerKey, playerInfo);

          const teamKey = `${pick.prop.player.team.teamId}-${pick.prop.player.team.league}`;
          const teamInfo = {
            fullName: pick.prop.player.team.fullName,
            teamId: pick.prop.player.team.teamId,
            league: pick.prop.player.team.league,
          };

          pickedTeamCounts.set(
            teamKey,
            (pickedTeamCounts.get(teamKey) || 0) + 1,
          );
          pickedTeamInfo.set(teamKey, teamInfo);
        }
      }
    }

    const mostBetPlayerKey = getMaxKey(pickedPlayerCounts);
    const mostBetTeamKey = getMaxKey(pickedTeamCounts);

    res.json({
      currentRank: findRank(userResult.points),
      peakRank: findRank(peakPoints),
      pointsTimeline,
      matchStats: {
        total: filteredMatchUsers.filter(
          (matchUser) => matchUser.status != "not_resolved",
        ).length,
        wins: filteredMatchUsers.filter(
          (matchUser) => matchUser.status == "win",
        ).length,
        draws: filteredMatchUsers.filter(
          (matchUser) => matchUser.status == "draw",
        ).length,
        losses: filteredMatchUsers.filter(
          (matchUser) =>
            matchUser.status == "disqualified" || matchUser.status == "loss",
        ).length,
      },
      parlayStats: {
        total: filteredMatchUsers
          .filter((matchUser) => matchUser.status != "not_resolved")
          .reduce(
            (accum, curr) =>
              accum + curr.parlays.filter((parlay) => parlay.resolved).length,
            0,
          ),
        wins: filteredMatchUsers
          .filter((matchUser) => matchUser.status != "not_resolved")
          .reduce(
            (accum, curr) =>
              accum +
              curr.parlays.filter(
                (parlay) => parlay.resolved && parlay.profit > 0,
              ).length,
            0,
          ),
        losses: filteredMatchUsers
          .filter((matchUser) => matchUser.status != "not_resolved")
          .reduce(
            (accum, curr) =>
              accum +
              curr.parlays.filter(
                (parlay) => parlay.resolved && parlay.profit <= 0,
              ).length,
            0,
          ),
      },
      mostBetPlayer:
        mostBetPlayerKey == null
          ? null
          : {
              player: pickedPlayerInfo.get(mostBetPlayerKey)!,
              count: pickedPlayerCounts.get(mostBetPlayerKey)!,
            },
      mostBetTeam:
        mostBetTeamKey == null
          ? null
          : {
              team: pickedTeamInfo.get(mostBetTeamKey)!,
              count: pickedTeamCounts.get(mostBetTeamKey)!,
            },
    });
  } catch (error) {
    handleError(error, res, "Users route");
  }
});
