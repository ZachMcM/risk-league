import { and, desc, eq, gt, gte, lt, notInArray } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { Router } from "express";
import moment from "moment";
import z from "zod";
import { db } from "../db";
import {
  baseballPlayerStats,
  basketballPlayerStats,
  dynastyLeagueUser,
  footballPlayerStats,
  game,
  leagueType,
  matchUser,
  player,
  prop,
} from "../db/schema";
import { apiKeyMiddleware, authMiddleware } from "../middleware";
import { redis } from "../redis";
import { handleError } from "../utils/handleError";
import { logger } from "../logger";

export const propsRoute = Router();

propsRoute.get("/props/today/players/:playerId", authMiddleware, async (req, res) => {
  try {
    const playerId = parseInt(req.params.playerId as string);

    if (isNaN(playerId)) {
      res.status(400).json({ error: "Invalid playerId" });
      return;
    }

    if (!req.query.matchId && !req.query.dynastyLeagueId) {
      res.status(400).json({
        error: "You must provide either a matchId or a dynastyLeagueId",
      });
      return;
    }

    let league;
    const propsPickedAlready: number[] = [];

    if (req.query.matchId) {
      const matchId = parseInt(req.query.matchId as string);

      if (isNaN(matchId)) {
        res.status(400).json({ error: "Invalid matchId" });
        return;
      }

      logger.debug(`matchId: ${matchId}`)

      const matchUserResult = await db.query.matchUser.findFirst({
        where: and(
          eq(matchUser.userId, res.locals.userId!),
          eq(matchUser.matchId, matchId)
        ),
        with: {
          parlays: {
            with: {
              picks: {
                columns: {
                  propId: true,
                },
              },
            },
          },
          match: {
            columns: {
              league: true,
            },
          },
        },
      });

      if (!matchUserResult) {
        res.status(404).json({
          error: "No matchUser found with the provided credentials",
        });
        return;
      }

      league = matchUserResult.match.league;

      matchUserResult.parlays.forEach((parlay) => {
        parlay.picks.forEach((pick) => {
          propsPickedAlready.push(pick.propId);
        });
      });
    } else {
      const dynastyLeagueId = parseInt(req.query.dynastyLeagueId as string);

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
            parlays: {
              with: {
                picks: {
                  columns: {
                    propId: true,
                  },
                },
              },
            },
            dynastyLeague: {
              columns: {
                league: true,
              },
            },
          },
        });

      if (!dynastyLeagueUserResult) {
        res.status(404).json({
          error: "No dynastyLeagueUser found",
        });
        return;
      }

      league = dynastyLeagueUserResult.dynastyLeague.league;

      dynastyLeagueUserResult.parlays.forEach((parlay) => {
        parlay.picks.forEach((pick) => {
          propsPickedAlready.push(pick.propId);
        });
      });
    }

    const playerResult = await db.query.player.findFirst({
      where: and(eq(player.playerId, playerId), eq(player.league, league)),
      with: {
        team: true,
      },
    });

    const startOfDay = moment()
      .startOf("day")
      .toISOString();
    const endOfDay = moment().endOf("day").toISOString();

    const availablePropIds = await db
      .select({ id: prop.id })
      .from(prop)
      .innerJoin(
        game,
        and(eq(prop.gameId, game.gameId), eq(prop.league, game.league))
      )
      .where(
        and(
          gte(game.startTime, startOfDay),
          lt(game.startTime, endOfDay),
          gt(game.startTime, new Date().toISOString()),
          eq(game.league, league),
          eq(prop.playerId, playerId),
          notInArray(prop.id, propsPickedAlready)
        )
      );

    const extendedAvailableProps = (
      await Promise.all(
        availablePropIds.map(async (propEntry) => {
          const propResult = await db.query.prop.findFirst({
            where: eq(prop.id, propEntry.id),
            with: {
              game: {
                with: {
                  homeTeam: true,
                  awayTeam: true,
                },
              },
              player: {
                with: {
                  team: true,
                },
              },
            },
          });

          return propResult;
        })
      )
    ).filter((prop) => prop !== undefined);

    const fromTable =
      league == "MLB"
        ? baseballPlayerStats
        : ["NFL", "NCAAFB"].includes(league)
        ? footballPlayerStats
        : basketballPlayerStats;

    const prevGameStats = await db
      .select({ stats: fromTable, game: game })
      .from(fromTable)
      .innerJoin(
        game,
        and(
          eq(fromTable.gameId, game.gameId),
          eq(fromTable.league, game.league)
        )
      )
      .where(
        and(
          eq(fromTable.playerId, playerId),
          eq(fromTable.league, league),
          eq(fromTable.status, "ACT")
        )
      )
      .orderBy(desc(game.startTime))
      .limit(5);

    const propsWithPastResults = extendedAvailableProps.map((prop) => ({
      ...prop,
      previousResults: prevGameStats.map((prev) => ({
        time: prev.game.startTime,
        value: (prev.stats as any)[prop.statName] || 0,
      })),
    }));

    const gameIds = [
      ...new Set(extendedAvailableProps.map((prop) => prop.gameId)),
    ];

    const gamesList = await Promise.all(
      gameIds.map(async (id) => {
        const gameResult = await db.query.game.findFirst({
          where: and(eq(game.gameId, id), eq(game.league, league)),
          with: {
            awayTeam: true,
            homeTeam: true,
          },
        });

        return gameResult;
      })
    );

    res.json({
      player: playerResult,
      games: gamesList,
      props: propsWithPastResults,
    });
  } catch (error) {
    handleError(error, res, "Props");
  }
});

propsRoute.get("/props/today", authMiddleware, async (req, res) => {
  try {
    const propsPickedAlready: number[] = [];
    let league;

    if (req.query.matchId) {
      const matchId = parseInt(req.query.matchId as string);

      if (isNaN(matchId)) {
        res.status(400).json({ error: "Invalid matchId" });
        return;
      }

      const matchUserResult = await db.query.matchUser.findFirst({
        where: and(
          eq(matchUser.userId, res.locals.userId!),
          eq(matchUser.matchId, matchId)
        ),
        with: {
          parlays: {
            with: {
              picks: {
                columns: {
                  propId: true,
                },
              },
            },
          },
          match: {
            columns: {
              league: true,
            },
          },
        },
      });

      if (!matchUserResult) {
        res.status(404).json({
          error: "No matchUser found with the provided credentials",
        });
        return;
      }

      league = matchUserResult.match.league;

      matchUserResult.parlays.forEach((parlay) => {
        parlay.picks.forEach((pick) => {
          propsPickedAlready.push(pick.propId);
        });
      });
    } else if (req.query.dynastyLeagueId) {
      const dynastyLeagueId = parseInt(req.query.dynastyLeagueId as string);

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
            parlays: {
              with: {
                picks: {
                  columns: {
                    propId: true,
                  },
                },
              },
            },
            dynastyLeague: {
              columns: {
                league: true,
              },
            },
          },
        });

      if (!dynastyLeagueUserResult) {
        res.status(404).json({
          error: "No matchUser found with the provided credentials",
        });
        return;
      }

      league = dynastyLeagueUserResult.dynastyLeague.league;

      dynastyLeagueUserResult.parlays.forEach((parlay) => {
        parlay.picks.forEach((pick) => {
          propsPickedAlready.push(pick.propId);
        });
      });
    } else {
      league = req.query.league as
        | (typeof leagueType.enumValues)[number]
        | undefined;
    }

    if (!league || !leagueType.enumValues.includes(league)) {
      res.status(400).json({
        error:
          "Invalid params, no matchId, dynastLeagueId, or league was provided",
      });
      return;
    }

    const startOfDay = moment()
      .startOf("day")
      .toISOString();
    const endOfDay = moment().endOf("day").toISOString();

    const availablePropIds = await db
      .select({
        id: prop.id,
      })
      .from(prop)
      .innerJoin(
        game,
        and(eq(prop.gameId, game.gameId), eq(prop.league, game.league))
      )
      .where(
        and(
          gte(game.startTime, startOfDay),
          lt(game.startTime, endOfDay),
          gt(game.startTime, new Date().toISOString()),
          eq(game.league, league),
          notInArray(prop.id, propsPickedAlready)
        )
      );

    const extendedAvailableProps = await Promise.all(
      availablePropIds.map(async (propEntry) => {
        const propResult = await db.query.prop.findFirst({
          where: eq(prop.id, propEntry.id),
          with: {
            game: {
              with: {
                homeTeam: true,
                awayTeam: true,
              },
            },
            player: {
              with: {
                team: true,
              },
            },
          },
        });

        return propResult;
      })
    );

    res.json(extendedAvailableProps);
  } catch (error) {
    handleError(error, res, "Props route");
  }
});

const propsSchema = createInsertSchema(prop);

propsRoute.post("/props", apiKeyMiddleware, async (req, res) => {
  try {
    propsSchema.parse(req.body);

    const newProp = await db.insert(prop).values(req.body);

    res.json(newProp);
  } catch (error) {
    handleError(error, res, "Props route");
  }
});

const livePropUpdateSchema = z.object({
  playerId: z.number(),
  statName: z.string(),
  currentValue: z.number(),
});

propsRoute.patch("/props/live", apiKeyMiddleware, async (req, res) => {
  try {
    const statUpdates = req.body as z.infer<typeof livePropUpdateSchema>[];

    for (const entry of statUpdates) {
      livePropUpdateSchema.parse(entry);
    }

    await Promise.all(
      statUpdates.map(async ({ currentValue, playerId, statName }) => {
        const updatedProp = await db
          .update(prop)
          .set({ currentValue })
          .where(and(eq(prop.playerId, playerId), eq(prop.statName, statName)))
          .returning({ id: prop.id });

        for (const prop of updatedProp) {
          redis.publish("prop_updated", JSON.stringify({ id: prop.id }));
        }
      })
    );

    res.json({ success: true });
  } catch (error) {
    handleError(error, res, "Props");
  }
});
