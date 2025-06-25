import { db } from "../db/db";
import { findRank } from "./findRank";

export async function getRank(userId: string) {
  const user = await db
    .selectFrom("users")
    .select("elo_rating")
    .where("id", "=", userId)
    .executeTakeFirstOrThrow()

  const rankInfo = findRank(user.elo_rating);

  return rankInfo
}
