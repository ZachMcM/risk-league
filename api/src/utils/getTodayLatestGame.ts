import { getTodayNBAGames } from "./getTodayNBAGames";

export async function getTodayLatestGame() {
  const todayNBAGames = await getTodayNBAGames();

  if (todayNBAGames.length == 0) {
    return null
  }

  return todayNBAGames.reduce((latest, current) => {
    const latestTime = new Date(latest.gameDateTimeUTC).getTime();
    const currentTime = new Date(current.gameDateTimeUTC).getTime();
    return currentTime > latestTime ? current : latest;
  });
}
