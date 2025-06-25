import { NBACdnGameData } from "../types/nbaSchedule";

export async function getTodayNBAGames() {
  const res = await fetch(
    "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json"
  );
  const data = await res.json();

  let today = `${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })} 00:00:00`;

  if (process.env.TEST_DATE) {
    today = process.env.TEST_DATE;
  }

  const gameDates = data.leagueSchedule.gameDates as {
    gameDate: string;
    games: NBACdnGameData[];
  }[];
  for (const gameDate of gameDates) {
    if (gameDate.gameDate == today) {
      return gameDate.games;
    }
  }

  return [];
}
