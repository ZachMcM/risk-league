import { eq } from "drizzle-orm";
import { db } from "../drizzle";
import { findRank } from "./findRank";
import { users } from "../drizzle/schema";

export async function getRank(userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      eloRating: true
    }
  })

  const rank = findRank(user?.eloRating!);

  return rank
}
