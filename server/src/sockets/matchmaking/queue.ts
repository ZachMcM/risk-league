import { redis } from "../../redis";
import { getRank } from "../../utils/getRank";

const QUEUE_KEY = "matchmaking:queue";

export async function addToQueue(userId: string) {
  await redis.rPush(QUEUE_KEY, userId);
}

export async function removeFromQueue(userId: string) {
  await redis.lRem(QUEUE_KEY, 0, userId);
}

export async function getPair(): Promise<{
  user1: string;
  user2: string;
} | null> {
  const queue = await redis.lRange(QUEUE_KEY, 0, -1);

  for (let i = 0; i < queue.length; i++) {
    const user1 = queue[i];
    const user1Rank = await getRank(user1);

    for (let j = i + 1; j < queue.length; j++) {
      const user2 = queue[j];
      const user2Rank = await getRank(user2);

      if (
        user1Rank.currentRank.tier == user2Rank.currentRank.tier &&
        user1Rank.currentRank.level == user2Rank.currentRank.level
      ) {
        await redis.lRem(QUEUE_KEY, 0, user1);
        await redis.lRem(QUEUE_KEY, 0, user2);

        return { user1, user2 };
      }
    }
  }

  return null;
}
