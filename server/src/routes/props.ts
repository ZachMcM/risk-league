import { Router } from "express";
import { authMiddleware } from "./auth";
import { db } from "../drizzle";
import { and, eq, gt, gte, lt, notInArray } from "drizzle-orm";
import { leagueType, matchUsers, props } from "../drizzle/schema";
import moment from "moment";

export const propsRoute = Router();

propsRoute.get("/props/all", authMiddleware, async (req, res) => {
  const league = req.query.league;

  if (!league || !leagueType.enumValues.includes(league as any)) {
    res.status(400).json({
      error: "Invalid league",
      message: "League parameter is invalid",
    });
    return;
  }

  try {
    const allProps = await db.query.props.findMany({
      where: eq(props.league, league as (typeof leagueType.enumValues)[number]),
      with: {
        player: {
          with: {
            team: true
          }
        },
        parlayPicks: true,
      },
      // TODO delete
      limit: 10
    });

    const allPropsWithPickCount = allProps.map((prop) => ({
      ...prop,
      parlayPicksCount: prop.parlayPicks.length,
    }));

    res.json(allPropsWithPickCount);
  } catch (err) {
    res.status(500).json({ error: "Server Error", message: err });
  }
});

propsRoute.get("/props/today", authMiddleware, async (req, res) => {
  const league = req.query.league;

  if (!league || !leagueType.enumValues.includes(league as any)) {
    res.status(400).json({
      error: "Invalid league",
      message: "League parameter is invalid",
    });
    return;
  }

  try {
    const startOfDay = moment().startOf("day").toISOString();
    const endOfDay = moment().endOf("day").toISOString();

    const todayMatches = await db.query.matchUsers.findMany({
      where: and(
        gte(matchUsers.createdAt, startOfDay),
        lt(matchUsers.createdAt, endOfDay)
      ),
      columns: {
        id: true,
      },
      with: {
        parlays: {
          with: {
            parlayPicks: true,
          },
        },
      },
    });

    const propsPickedAlready: number[] = [];

    todayMatches.forEach((match) => {
      match.parlays.forEach((parlay) => {
        parlay.parlayPicks.forEach((pick) => {
          propsPickedAlready.push(pick.propId!);
        });
      });
    });

    const availableProps = await db.query.props.findMany({
      where: and(
        gt(props.gameStartTime, new Date().toISOString()), // games that haven't started
        eq(props.league, league as (typeof leagueType.enumValues)[number]), // correct league
        notInArray(props.id, propsPickedAlready)
      ),
      with: {
        player: {
          with: {
            team: true
          }
        },
        parlayPicks: true,
      },
    });

    const availablePropsWithPickCount = availableProps.map((prop) => ({
      ...prop,
      parlayPicksCount: prop.parlayPicks.length,
    }));

    res.json(availablePropsWithPickCount);
  } catch (err) {
    res.status(500).json({ error: "Server Error", message: err });
  }
});
