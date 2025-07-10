import { db } from "../../drizzle";
import { matches, matchUsers } from "../../drizzle/schema";

export async function createMatch({
  user1,
  user2,
}: {
  user1: number;
  user2: number;
}) {
  const [match] = await db
    .insert(matches)
    .values({ resolved: false })
    .returning({ id: matches.id });

  await db.insert(matchUsers).values({
    matchId: match.id,
    userId: user1,
  });

  await db.insert(matchUsers).values({
    matchId: match.id,
    userId: user2,
  });

  return match.id;
}
