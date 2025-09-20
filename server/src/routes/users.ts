import { and, desc, eq, ilike, ne } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import {
  cosmetic,
  cosmeticType,
  leagueType,
  user,
  userCosmetic,
} from "../db/schema";
import { authMiddleware } from "../middleware";
import { ranks } from "../types/ranks";
import { calculateProgression } from "../utils/calculateProgression";
import { findNextRank } from "../utils/findNextRank";
import { findRank } from "../utils/findRank";
import { getMaxKey } from "../utils/getMaxKey";
import { handleError } from "../utils/handleError";
import { invalidateQueries } from "../utils/invalidateQueries";

export const usersRoute = Router();

usersRoute.patch("/users/banner", authMiddleware, async (req, res) => {
  try {
    const userId = res.locals.userId!;
    console.log(req.body);
    if (!req.body.banner) {
      res.status(400).json({ error: "Missing banner" });
      return;
    }
    const { banner } = req.body;

    const cosmeticExists = await db.query.cosmetic.findFirst({
      where: and(eq(cosmetic.type, "banner"), eq(cosmetic.url, banner)),
    });

    if (!cosmeticExists) {
      res.status(404).json({ error: "This banner doesn't exist" });
      return;
    }

    await db.update(user).set({ banner }).where(eq(user.id, userId));

    invalidateQueries(["user", res.locals.userId!]);

    res.json({ success: true });
  } catch (error) {
    handleError(error, res, "Users");
  }
});

usersRoute.get("/users/cosmetics/all", authMiddleware, async (req, res) => {
  try {
    const allUserCosmetics = await db.query.userCosmetic.findMany({
      where: eq(userCosmetic.userId, res.locals.userId!),
    });

    res.json(allUserCosmetics);
  } catch (error) {
    handleError(error, res, "Users");
  }
});

usersRoute.get(
  "/users/cosmetics/:cosmetic",
  authMiddleware,
  async (req, res) => {
    try {
      const id = res.locals.userId!;
      const cosmeticTypeVal = req.params.cosmetic as
        | (typeof cosmeticType.enumValues)[number]
        | undefined;

      if (
        cosmeticTypeVal == undefined ||
        !cosmeticType.enumValues.includes(cosmeticTypeVal)
      ) {
        res.status(400).json({ error: "Invalid cosmetic parameter" });
        return;
      }

      const allCosmetics: {
        id: number;
        type: "banner" | "image";
        title: string;
        url: string;
      }[] = [];

      const defaultCosmetics = await db.query.cosmetic.findMany({
        where: and(
          eq(cosmetic.type, cosmeticTypeVal),
          eq(cosmetic.isDefault, true)
        ),
      });

      const achievedCosmetics = await db
        .select({
          id: cosmetic.id,
          type: cosmetic.type,
          title: cosmetic.title,
          url: cosmetic.url,
        })
        .from(userCosmetic)
        .innerJoin(cosmetic, eq(userCosmetic.cosmeticId, cosmetic.id))
        .where(
          and(eq(userCosmetic.userId, id), eq(cosmetic.type, cosmeticTypeVal))
        )
        .orderBy(desc(userCosmetic.acquiredAt));

      allCosmetics.push(...achievedCosmetics);
      allCosmetics.push(...defaultCosmetics);

      res.json(allCosmetics);
    } catch (error) {
      handleError(error, res, "Users");
    }
  }
);

usersRoute.get("/users/:id/rank", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    const userResult = await db.query.user.findFirst({
      where: eq(user?.id, id),
      columns: {
        id: true,
        username: true,
        image: true,
        points: true,
        banner: true,
      },
    });

    res.json(
      userResult === undefined
        ? undefined
        : {
            ...userResult,
            rank: findRank(userResult.points),
          }
    );
  } catch (error) {
    handleError(error, res, "Users");
  }
});

usersRoute.get("/users/search", authMiddleware, async (req, res) => {
  try {
    const query = (req.query.query as string | undefined) || "";

    if (!query) {
      res.json([]);
      return;
    }

    const usersResults = await db.query.user.findMany({
      where: and(
        ilike(user.username, `%${query}%`),
        ne(user.id, res.locals.userId!)
      ),
      columns: {
        id: true,
        username: true,
        image: true,
        points: true,
        banner: true,
      },
      limit: 10,
    });

    res.json(
      usersResults.map((user) => ({
        ...user,
        rank: findRank(user.points),
      }))
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
        banner: true,
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
      points:
        rank.tier == "Legend"
          ? Math.round(userResult.points - ranks[ranks.length - 1].minPoints)
          : undefined,
    });
  } catch (error) {
    handleError(error, res, "Users route");
  }
});

usersRoute.get("/users/:id/career", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    const userResult = await db.query.user.findFirst({
      columns: {
        id: true,
        username: true,
        image: true,
        points: true,
        banner: true,
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
                payout: true,
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
                            image: true,
                          },
                          with: {
                            team: {
                              columns: {
                                fullName: true,
                                teamId: true,
                                league: true,
                                image: true,
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
      where: eq(user.id, id),
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

    const pickedPlayerCounts: Map<string, number> = new Map();
    const pickedPlayerInfo: Map<
      string,
      {
        playerId: number;
        league: (typeof leagueType.enumValues)[number];
        image: string | null;
        name: string;
      }
    > = new Map();

    const pickedTeamCounts: Map<string, number> = new Map();
    const pickedTeamInfo: Map<
      string,
      {
        image: string | null;
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
            image: pick.prop.player.image,
          };

          pickedPlayerCounts.set(
            playerKey,
            (pickedPlayerCounts.get(playerKey) || 0) + 1
          );
          pickedPlayerInfo.set(playerKey, playerInfo);

          const teamKey = `${pick.prop.player.team.teamId}-${pick.prop.player.team.league}`;
          const teamInfo = {
            fullName: pick.prop.player.team.fullName,
            teamId: pick.prop.player.team.teamId,
            league: pick.prop.player.team.league,
            image: pick.prop.player.team.image,
          };

          pickedTeamCounts.set(
            teamKey,
            (pickedTeamCounts.get(teamKey) || 0) + 1
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
                (parlay) => parlay.resolved && parlay.payout > 0
              ).length,
            0
          ),
        losses: filteredMatchUsers
          .filter((matchUser) => matchUser.status != "not_resolved")
          .reduce(
            (accum, curr) =>
              accum +
              curr.parlays.filter(
                (parlay) => parlay.resolved && parlay.payout == 0
              ).length,
            0
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

usersRoute.get("/users/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;

    const userResult = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        username: true,
        image: true,
        points: true,
        banner: true,
      },
    });

    if (!userResult) {
      res.status(404).json({ error: "No user found" });
      return;
    }

    res.json({
      ...userResult,
      rank: findRank(userResult.points),
    });
  } catch (error) {
    handleError(error, res, "Users");
  }
});
