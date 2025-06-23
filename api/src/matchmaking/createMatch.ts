import { db } from "../db/db";
import { getGameEndTime } from "../utils/getGameEndTime";
import { getTodayLatestGame } from "../utils/getTodayLatestGame";

export async function createMatch({
  user1,
  user2,
}: {
  user1: string;
  user2: string;
}) {
  const todayLatestGame = await getTodayLatestGame();
  if (todayLatestGame == null) {
    return null;
  }
  const endTime = getGameEndTime(todayLatestGame.gameDateTimeUTC);

  const match = await db
    .insertInto("matches")
    .values({ ends_at: endTime })
    .returning(["id"])
    .executeTakeFirstOrThrow();

  await db
    .insertInto("match_users")
    .values({
      match_id: match.id,
      user_id: user1,
    })
    .execute();

  await db
    .insertInto("match_users")
    .values({
      match_id: match.id,
      user_id: user2,
    })
    .execute();

  return match.id;
}
