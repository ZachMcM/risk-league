import { db } from "../db/db";

export async function getMatchStats(
  matchId: string,
  opponent: boolean,
  userId: string
) {
  const match = await db
    .selectFrom("match_users as mu")
    .innerJoin("users", "users.id", "mu.user_id")
    .select(["balance", "match_id as matchId", "user_id", "username", "image"])
    .where("mu.user_id", opponent ? "!=" : "=", userId)
    .where("mu.match_id", "=", matchId)
    .executeTakeFirstOrThrow();

  if (!match) {
    throw Error();
  }

  const parlayCounts = await db
    .selectFrom("parlays")
    .select([
      db.fn.count("id").filterWhere("status", "=", "hit").as("parlaysWon"),
      db.fn.count("id").filterWhere("status", "=", "missed").as("parlaysLost"),
      db.fn
        .count("id")
        .filterWhere("status", "=", "in_progress")
        .as("parlaysInProgress"),
    ])
    .where("parlays.match_user_id", "=", match.matchId)
    .executeTakeFirstOrThrow();

  return {
    ...match,
    ...parlayCounts,
  };
}
