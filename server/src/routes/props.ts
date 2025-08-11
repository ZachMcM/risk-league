import { Router } from "express";
import { and, eq, gt, gte, lt, notInArray, count, inArray } from "drizzle-orm";
import moment from "moment";
import { game, matchUser, prop, player, team, pick } from "../db/schema";
import { db } from "../db";
import { alias } from "drizzle-orm/pg-core";
import { authMiddleware } from "../middleware";
import { logger } from "../logger";

export const propsRoute = Router();

propsRoute.get("/props/today", authMiddleware, async (req, res) => {
  try {
    const league = req.query.league;

    if (!league) {
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
      .innerJoin(game, eq(prop.gameId, game.id))
      .innerJoin(player, eq(prop.playerId, player.id))
      .innerJoin(team, eq(player.teamId, team.id))
      .innerJoin(homeTeam, eq(game.homeTeamId, homeTeam.id))
      .innerJoin(awayTeam, eq(game.awayteamId, awayTeam.id))
      .where(
        and(
          // gt(game.startTime, new Date().toISOString()), // games that haven't started
          eq(game.league, league as string), // correct league
          notInArray(prop.id, propsPickedAlready)
        )
      );

    logger.debug(`Available props length ${availableProps.length}`);

    // Get pick counts for each prop
    const propIds = availableProps.map((p) => p.prop.id);

    const pickCountsList =
      propIds.length > 0
        ? await db
            .select({
              propId: pick.propId,
              count: count(pick.id),
            })
            .from(pick)
            .where(inArray(pick.propId, propIds))
            .groupBy(pick.propId)
        : [];

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
      picksCount:
        pickCountsList.find((pc) => pc.propId === row.prop.id)?.count || 0,
    }));

    res.json(availablePropsWithPickCount);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error });
  }
});

propsRoute.post("/props", authMiddleware, async (req, res) => {
  try {
    const {
      line,
      gameId,
      playerId,
      statName,
      statDisplayName,
      choices,
    } = req.body as {
      line: number | undefined;
      gameId: number | undefined;
      playerId: number | undefined;
      statName: string | undefined;
      statDisplayName: string | undefined;
      choices: string[] | undefined;
    };

    if (
      !line ||
      !gameId ||
      !playerId ||
      !statName ||
      !statDisplayName ||
      !choices
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
    });

    res.json(newProp);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error });
  }
});
