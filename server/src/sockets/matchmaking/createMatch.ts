import { db } from "../../db/db";

export async function createMatch({
  user1,
  user2,
}: {
  user1: string;
  user2: string;
}) {
  const match = await db
    .insertInto("matches")
    .values({ resolved: false })
    .returning("id")
    .executeTakeFirstOrThrow();

  await db
    .insertInto("match_users")
    .values({
      match_id: match.id,
      user_id: user1,
      status: "not_resolved",
    })
    .execute();

  await db
    .insertInto("match_users")
    .values({
      match_id: match.id,
      user_id: user2,
      status: "not_resolved",
    })
    .execute();

  return match.id;
}
