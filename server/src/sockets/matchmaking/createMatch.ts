import { db } from "../../drizzle";
import { matches, matchUsers } from "../../drizzle/schema";

export async function createMatch({
  user1,
  user2,
  league,
}: {
  user1: number;
  user2: number;
  league: string;
}) {
  const [match] = await db
    .insert(matches)
    .values({ resolved: false, league })
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
