import { eq } from "drizzle-orm";
import { db } from "../../drizzle";
import { matches, matchUsers, users } from "../../drizzle/schema";

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

  const { eloRating: user1EloRating } = (
    await db
      .select({ eloRating: users.eloRating })
      .from(users)
      .where(eq(users.id, user1))
      .limit(1)
  )[0];
  const { eloRating: user2EloRating } = (
    await db
      .select({ eloRating: users.eloRating })
      .from(users)
      .where(eq(users.id, user2))
      .limit(1)
  )[0];

  await db.insert(matchUsers).values({
    eloRatingSnapshot: user1EloRating,
    matchId: match.id,
    userId: user1,
  });

  await db.insert(matchUsers).values({
    eloRatingSnapshot: user2EloRating,
    matchId: match.id,
    userId: user2,
  });

  return match.id;
}
