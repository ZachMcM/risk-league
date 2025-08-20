import { and, eq, gt, gte, lt, notInArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Router } from "express";
import moment from "moment";
import { db } from "../db";
import {
  game,
  leagueType,
  match,
  matchUser,
  player,
  prop,
  team,
} from "../db/schema";
import { logger } from "../logger";
import { apiKeyMiddleware, authMiddleware } from "../middleware";
import { handleError } from "../utils/handleError";
import { createInsertSchema } from "drizzle-zod";

export const propsRoute = Router();

propsRoute.get("/props/today", authMiddleware, async (req, res) => {
  try {
    const league = req.query.league;

    if (
      league === undefined ||
      !leagueType.enumValues.includes(league as any)
    ) {
      res.status(400).json({
        error: "League parameter is invalid",
      });
      return;
    }

    const startOfDay = moment().startOf("day").toISOString();
    const endOfDay = moment().endOf("day").toISOString();

    const todayMatches = await db.query.matchUser.findMany({
      where: and(
        gte(matchUser.createdAt, startOfDay),
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

    const propsPickedAlready: number[] = [];

    todayMatches
      .filter((match) => match.match.type == "competitive")
      .forEach((match) => {
        match.parlays.forEach((parlay) => {
          parlay.picks.forEach((pick) => {
            propsPickedAlready.push(pick.propId!);
          });
        });
      });

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
          gt(game.startTime, new Date().toISOString()), // games that haven't started
          eq(game.league, league as (typeof leagueType.enumValues)[number]), // correct league
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
