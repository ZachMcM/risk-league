import { eq } from "drizzle-orm";
import { db } from "../db";
import { user } from "../db/schema";
import { findRank } from "./findRank";

export async function getRank(userId: string) {
  const { points } = (
    await db
      .select({
        points: user.points,
      })
      .from(user)
      .where(eq(user.id, userId))
  )[0];

  return findRank(points);
}
