import { and, desc, eq, gt, gte, lt, notInArray } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { Router } from "express";
import moment from "moment";
import { db } from "../db";
import {
  baseballPlayerStats,
  basketballPlayerStats,
  footballPlayerStats,
  game,
  leagueType,
  matchUser,
  player,
  prop,
} from "../db/schema";
import {
  apiKeyMiddleware,
  apiKeyOrIpAddressMiddleware,
  authMiddleware,
} from "../middleware";
import { handleError } from "../utils/handleError";
import { logger } from "../logger";
import { success } from "zod";

export const propsRoute = Router();

propsRoute.get("/props/today/players/:playerId", async (req, res) => {
  try {
    const league = req.query.league as (typeof leagueType.enumValues)[number];
    const competitive = req.query.competitive === "false";
    const playerId = parseInt(req.params.playerId as string);

    if (
      league === undefined ||
      !leagueType.enumValues.includes(league as any) ||
      isNaN(playerId)
    ) {
      res.status(400).json({
        error: "League or playerId parameter is invalid",
      });
      return;
    }

    const startOfPreviousDay = moment().subtract(1, 'day').startOf("day").toISOString();
    const endOfDay = moment().endOf("day").toISOString();

    const propsPickedAlready: number[] = [];

    if (competitive) {
      const todayMatches = await db.query.matchUser.findMany({
        where: and(
          gte(matchUser.createdAt, startOfPreviousDay),
          lt(matchUser.createdAt, endOfDay)
        ),
        columns: {
          id: true,
        },
        with: {
          parlays: {
            with: {
              picks: true,
            },
          },
          match: {
            columns: {
              type: true,
            },
          },
        },
      });

      todayMatches
        .filter((match) => match.match.type == "competitive")
        .forEach((match) => {
          match.parlays.forEach((parlay) => {
            parlay.picks.forEach((pick) => {
              propsPickedAlready.push(pick.propId!);
            });
          });
        });
    }

    const playerResult = await db.query.player.findFirst({
      where: and(eq(player.playerId, playerId), eq(player.league, league)),
      with: {
        team: true,
      },
    });

    const availablePropIds = await db
      .select({ id: prop.id })
      .from(prop)
      .innerJoin(
        game,
        and(eq(prop.gameId, game.gameId), eq(prop.league, game.league))
      )
      .where(
        and(
          gte(game.startTime, startOfPreviousDay),
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
    const league = req.query.league as (typeof leagueType.enumValues)[number];
    const competitive = req.query.competitive === "false";

    if (
      league === undefined ||
      !leagueType.enumValues.includes(league as any)
    ) {
      res.status(400).json({
        error: "League parameter is invalid",
      });
      return;
    }

    const startOfPreviousDay = moment().subtract(1, 'day').startOf("day").toISOString();
    const endOfDay = moment().endOf("day").toISOString();

    const propsPickedAlready: number[] = [];

    if (competitive) {
      const todayMatches = await db.query.matchUser.findMany({
        where: and(
          gte(matchUser.createdAt, startOfPreviousDay),
          lt(matchUser.createdAt, endOfDay)
        ),
        columns: {
          id: true,
        },
        with: {
          parlays: {
            with: {
              picks: true,
            },
          },
          match: {
            columns: {
              type: true,
            },
          },
        },
      });

      todayMatches
        .filter((match) => match.match.type == "competitive")
        .forEach((match) => {
          match.parlays.forEach((parlay) => {
            parlay.picks.forEach((pick) => {
              propsPickedAlready.push(pick.propId!);
            });
          });
        });
    }

    logger.debug(`props already picked: ${propsPickedAlready}`)

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
          gte(game.startTime, startOfPreviousDay),
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

propsRoute.post("/props/league/:league", async (req, res) => {
  try {
    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const body = req.body;

    logger.info(`IP Addres: ${ipAddress}`)
    logger.info(`Req body: ${body}`)

    res.json({ success: true })
  } catch (error) {
    handleError(error, res, "Props");
  }
});
