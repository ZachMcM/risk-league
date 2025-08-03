import { eq } from "drizzle-orm";
import { db } from "../db";
import { user } from "../db/schema";
import { ranks } from "../types/ranks";

export async function getRank(userId: string) {
  const { points } = (
    await db
      .select({
        points: user.points,
      })
      .from(user)
      .where(eq(user.id, userId))
  )[0];

  for (let i = 0; i < ranks.length; i++) {
    if (points >= ranks[i].minPoints && points < ranks[i].maxPoints) {
      return ranks[i];
    }
  }

  return null;
}
