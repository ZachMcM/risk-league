import { and, eq, gt, gte, lt, notInArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Router } from "express";
import moment from "moment";
import { db } from "../db";
import {
  game,
  leagueType,
  matchUser,
  player,
  prop,
  team
} from "../db/schema";
import { logger } from "../logger";
import { apiKeyMiddleware, authMiddleware } from "../middleware";
import { handleError } from "../utils/handleError";

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
        lt(matchUser.createdAt, endOfDay),
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
      },
    });

    const propsPickedAlready: number[] = [];

    todayMatches.forEach((match) => {
      match.parlays.forEach((parlay) => {
        parlay.picks.forEach((pick) => {
          propsPickedAlready.push(pick.propId!);
        });
      });
    });

    const homeTeam = alias(team, "homeTeam");
    const awayTeam = alias(team, "awayTeam");

    const availableProps = await db
      .select({
        prop: prop,
        game: game,
        player: player,
        team: team,
        homeTeam: homeTeam,
        awayTeam: awayTeam,
      })
      .from(prop)
      .innerJoin(
        game,
        and(eq(prop.gameId, game.gameId), eq(prop.league, game.league)),
      )
      .innerJoin(
        player,
        and(eq(prop.playerId, player.playerId), eq(prop.league, player.league)),
      )
      .innerJoin(
        team,
        and(eq(player.teamId, team.teamId), eq(player.league, team.league)),
      )
      .innerJoin(
        homeTeam,
        and(
          eq(game.homeTeamId, homeTeam.teamId),
          eq(game.league, homeTeam.league),
        ),
      )
      .innerJoin(
        awayTeam,
        and(
          eq(game.awayTeamId, awayTeam.teamId),
          eq(game.league, awayTeam.league),
        ),
      )
      .where(
        and(
          gte(game.startTime, startOfDay),
          lt(game.startTime, endOfDay),
          gt(game.startTime, new Date().toISOString()), // games that haven't started
          eq(game.league, league as (typeof leagueType.enumValues)[number]), // correct league
          notInArray(prop.id, propsPickedAlready),
        ),
      );

    logger.debug(`Available props length ${availableProps.length}`);

    const availablePropsWithPickCount = availableProps.map((row) => ({
      ...row.prop,
      game: {
        ...row.game,
        homeTeam: row.homeTeam,
        awayTeam: row.awayTeam,
      },
      player: {
        ...row.player,
        team: row.team,
      },
    }));

    res.json(availablePropsWithPickCount);
  } catch (error) {
    handleError(error, res, "Props route");
  }
});

function validateChoices(choices: string[]) {
  for (const choice of choices) {
    if (!["over", "under"].includes(choice)) {
      return false
    }
  }
  return true
}

propsRoute.post("/props", apiKeyMiddleware, async (req, res) => {
  try {
    const {
      line,
      gameId,
      playerId,
      statName,
      statDisplayName,
      choices,
      league,
    } = req.body as {
      line: number | undefined;
      gameId: string | undefined;
      playerId: number | undefined;
      statName: string | undefined;
      statDisplayName: string | undefined;
      choices: string[] | undefined;
      league: string | undefined;
    };

    if (
      line == undefined ||
      gameId == undefined ||
      playerId == undefined ||
      league == undefined ||
      !leagueType.enumValues.includes(league as any) ||
      statName == undefined ||
      statDisplayName == undefined ||
      (!Array.isArray(choices) || (choices !== undefined && !validateChoices(choices)))
    ) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const newProp = await db.insert(prop).values({
      line,
      gameId,
      playerId,
      statDisplayName,
      statName,
      choices,
      league: league as (typeof leagueType.enumValues)[number],
    });

    res.json(newProp);
  } catch (error) {
    handleError(error, res, "Props route");
  }
});
