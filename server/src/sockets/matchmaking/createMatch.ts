import { db } from "../../drizzle";
import { matches, matchUsers, matchGameMode } from "../../drizzle/schema";

export async function createMatch({
  user1,
  user2,
  gameMode
}: {
  user1: number;
  user2: number;
  gameMode: typeof matchGameMode.enumValues[number]
}) {
  const [match] = await db
    .insert(matches)
    .values({ resolved: false, gameMode })
    .returning({ id: matches.id });

  // TODO add randomzied starting balances

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
