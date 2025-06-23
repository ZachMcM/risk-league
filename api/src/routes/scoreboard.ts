import { Router } from "express";
import { LiveGame, NbaScoreboardResponse } from "../types/nbaScoreboard";

export const scoreboard = Router();

const nbaScoreboardCdn = process.env.NBA_SCOREBOARD_CDN;

scoreboard.get("/scoreboard", async (_, res) => {
  try {
    const scoreboardRes = await fetch(nbaScoreboardCdn!);
    const data = (await scoreboardRes.json()) as NbaScoreboardResponse;

    const games: LiveGame[] = data.scoreboard.games.map((game) => ({
      gameId: game.gameId.toString(),
      period: game.period,
      gameClock: game.gameClock,
      homeTeam: {
        teamId: game.homeTeam.teamId.toString(),
        teamName: game.homeTeam.teamName,
        teamCity: game.homeTeam.teamCity,
        teamTriCode: game.homeTeam.teamTricode,
        score: game.homeTeam.score,
      },
      awayTeam: {
        teamId: game.awayTeam.teamId.toString(),
        teamName: game.awayTeam.teamName,
        teamCity: game.awayTeam.teamCity,
        teamTriCode: game.awayTeam.teamTricode,
        score: game.awayTeam.score,
      },
    }));

    res.json({ games });
  } catch (err) {
    res.status(500).json({ error: "Unexpected error" });
    return;
  }
});
