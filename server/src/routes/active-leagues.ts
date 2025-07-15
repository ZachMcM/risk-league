import { Router } from "express";
import { authMiddleware } from "./auth";
import { logger } from "../logger";
import moment from 'moment-timezone';

export const activeLeaguesRoute = Router();

activeLeaguesRoute.get("/active-leagues", authMiddleware, async (_, res) => {
  const formattedDate = moment().tz('America/New_York').format('YYYY-MM-DD');
  logger.debug(`Formatted date ${formattedDate}`)

  const nbaRes: any[] = (
    await (await fetch(`${process.env.NBA_GAMES}`)).json()
  ).scoreboard.games;

  const mlbRes: any[] = (
    await (
      await fetch(
        `${process.env.MLB_GAMES}&startDate=${formattedDate}&endDate=${formattedDate}`
      )
    ).json()
  ).dates[0];

  const activeLeagues = [];

  if (nbaRes.length > 0) {
    activeLeagues.push("nba");
  }

  if (mlbRes.length > 0) {
    activeLeagues.push("mlb");
  }

  res.json(activeLeagues);
});
