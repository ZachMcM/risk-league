import { PutObjectCommand } from "@aws-sdk/client-s3";
import { and, eq, ilike, ne } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { leagueType, user } from "../db/schema";
import { logger } from "../logger";
import { authMiddleware, upload } from "../middleware";
import { r2 } from "../r2";
import { ranks } from "../types/ranks";
import { calculateProgression } from "../utils/calculateProgression";
import { findNextRank } from "../utils/findNextRank";
import { findRank } from "../utils/findRank";
import { getMaxKey } from "../utils/getMaxKey";
import { handleError } from "../utils/handleError";

export const usersRoute = Router();

usersRoute.patch(
  "/users/:id/image",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const userId = req.params.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      const fileName = `profile/${userId}-${Date.now()}.${file.originalname
        .split(".")
        .pop()}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
      logger.debug(imageUrl);

      await db.update(user).set({ image: imageUrl }).where(eq(user.id, userId));

      res.json(imageUrl);
    } catch (error) {
      handleError(error, res, "Users");
    }
  }
);

usersRoute.put(
  "/users/:id",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const userId = req.params.id;
      const file = req.file;
      const username = req.body.username as string | undefined;
      const name = req.body.name as string | undefined;

      if (!name) {
        res.status(400).json({ error: "No name provided" });
        return;
      }

      if (!username) {
        res.status(400).json({ error: "No username provided" });
        return;
      }

      let imageUrl: string | undefined | null;

      if (file) {
        const fileName = `profile/${userId}-${Date.now()}.${file.originalname
          .split(".")
          .pop()}`;

        await r2.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
      }

      await db
        .update(user)
        .set(
          imageUrl ? { image: imageUrl, username, name } : { username, name }
        )
        .where(eq(user.id, userId));

      res.json({ success: true });
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
        header: true,
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
        header: true,
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
                            image: true
                          },
                          with: {
                            team: {
                              columns: {
                                fullName: true,
                                teamId: true,
                                league: true,
                                image: true
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
        image: string | null
        name: string;
      }
    > = new Map();

    const pickedTeamCounts: Map<string, number> = new Map();
    const pickedTeamInfo: Map<
      string,
      {
        image: string | null
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
            image: pick.prop.player.image
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
            image: pick.prop.player.team.image
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
