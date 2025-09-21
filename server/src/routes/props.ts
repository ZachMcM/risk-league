import { and, desc, eq, gt, gte, lt, notInArray, inArray } from "drizzle-orm";
import { Router } from "express";
import moment from "moment";
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
import { logger } from "../logger";
import { authMiddleware } from "../middleware";
import { getAvailablePropsForUser } from "../utils/getAvailableProps";
import { handleError } from "../utils/handleError";

export const propsRoute = Router();

propsRoute.get(
  "/props/today/players/:playerId",
  authMiddleware,
  async (req, res) => {
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

        logger.debug(`matchId: ${matchId}`);

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

      const now = moment();
      const startTime = now.clone().subtract(6, "hours").toISOString();
      const endTime = now.clone().add(18, "hours").toISOString();

      const availablePropIds = await db
        .select({ id: prop.id })
        .from(prop)
        .innerJoin(
          game,
          and(eq(prop.gameId, game.gameId), eq(prop.league, game.league))
        )
        .where(
          and(
            gte(game.startTime, startTime),
            lt(game.startTime, endTime),
            gt(game.startTime, new Date().toISOString()),
            eq(game.league, league),
            eq(prop.playerId, playerId),
            notInArray(
              prop.id,
              propsPickedAlready.length > 0 ? propsPickedAlready : [-1]
            )
          )
        );

      const extendedAvailableProps = await db.query.prop.findMany({
        where: inArray(
          prop.id,
          availablePropIds.map((p) => p.id)
        ),
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

      const propsWithPastResults = extendedAvailableProps.map((prop) => {
        // Convert snake_case to camelCase for database column lookup
        const camelCaseStatName = prop.statName.replace(
          /_([a-z])/g,
          (_, letter) => letter.toUpperCase()
        );

        return {
          ...prop,
          previousResults: prevGameStats.map((prev) => ({
            time: prev.game.startTime,
            value: (prev.stats as any)[camelCaseStatName] || 0,
          })),
        };
      });

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
  }
);

propsRoute.get("/props/today/count", async (req, res) => {
  try {
    const league = req.query.league as
      | (typeof leagueType.enumValues)[number]
      | undefined;

    if (!league || !leagueType.enumValues.includes(league)) {
      res.status(400).json({ error: "Invalid or missing league parameter" });
      return;
    }

    const now = moment();
    const startTime = now.clone().subtract(6, "hours").toISOString();
    const endTime = now.clone().add(18, "hours").toISOString();

    const availablePropsCount = await db
      .select({
        propCount: prop.id,
        gameId: game.gameId,
      })
      .from(prop)
      .innerJoin(
        game,
        and(eq(prop.gameId, game.gameId), eq(prop.league, game.league))
      )
      .where(
        and(
          gte(game.startTime, startTime),
          lt(game.startTime, endTime),
          gt(game.startTime, new Date().toISOString()),
          eq(game.league, league)
        )
      );

    const uniqueGameIds = [
      ...new Set(availablePropsCount.map((item) => item.gameId)),
    ];

    res.json({
      availableProps: availablePropsCount.length,
      totalGames: uniqueGameIds.length,
    });
  } catch (error) {
    handleError(error, res, "Props count route");
  }
});

propsRoute.get("/props/today", authMiddleware, async (req, res) => {
  try {
    const matchId = req.query.matchId
      ? parseInt(req.query.matchId as string)
      : undefined;
    const dynastyLeagueId = req.query.dynastyLeagueId
      ? parseInt(req.query.dynastyLeagueId as string)
      : undefined;
    const league = req.query.league as
      | (typeof leagueType.enumValues)[number]
      | undefined;

    if (!matchId && !dynastyLeagueId && !league) {
      res.status(400).json({
        error:
          "Invalid params, no matchId, dynastyLeagueId, or league was provided",
      });
      return;
    }

    if (matchId || dynastyLeagueId) {
      const result = await getAvailablePropsForUser({
        userId: res.locals.userId!,
        matchId,
        dynastyLeagueId,
        fullData: true,
      });
      res.json(result.props);
    } else if (league) {
      if (!leagueType.enumValues.includes(league)) {
        res.status(400).json({
          error: "Invalid league provided",
        });
        return;
      }

      const now = moment();
      const startTime = now.clone().subtract(6, "hours").toISOString();
      const endTime = now.clone().add(18, "hours").toISOString();

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
            gte(game.startTime, startTime),
            lt(game.startTime, endTime),
            gt(game.startTime, new Date().toISOString()),
            eq(game.league, league as any)
          )
        );

      const extendedAvailableProps = await db.query.prop.findMany({
        where: inArray(
          prop.id,
          availablePropIds.map((p) => p.id)
        ),
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

      res.json(extendedAvailableProps);
    } else {
      res.json({ error: "Please pass in league, matchId, or dynastyLeagueId" });
    }
  } catch (error) {
    handleError(error, res, "Props route");
  }
});
