import { redis } from "../../redis";
import { getRank } from "../../utils/getRank";

const QUEUE_KEY = "matchmaking:queue";

export async function cleanInvalidEntries() {
  const queue = await redis.lRange(QUEUE_KEY, 0, -1);
  
  for (const entry of queue) {
    if (!entry || isNaN(parseInt(entry))) {
      await redis.lRem(QUEUE_KEY, 0, entry);
    }
  }
}

export async function addToQueue(userId: string) {
  await redis.rPush(QUEUE_KEY, userId.toString());
}

export async function removeFromQueue(userId: string) {
  await redis.lRem(QUEUE_KEY, 0, userId.toString());
}

export async function getPair(): Promise<{
  user1: string;
  user2: string;
} | null> {
  const queue = await redis.lRange(QUEUE_KEY, 0, -1);

  for (let i = 0; i < queue.length; i++) {
    const user1 = queue[i];
    const user1Rank = await getRank(parseInt(user1));

    for (let j = i + 1; j < queue.length; j++) {
      const user2 = queue[j];
      const user2Rank = await getRank(parseInt(user2));

      if (
        user1Rank?.tier == user2Rank?.tier &&
        user1Rank?.level == user2Rank?.level
      ) {
        await redis.lRem(QUEUE_KEY, 0, user1);
        await redis.lRem(QUEUE_KEY, 0, user2);

        return { user1, user2 };
      }
    }
  }

  return null;
}
