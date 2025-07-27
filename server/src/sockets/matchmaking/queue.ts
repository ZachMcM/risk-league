import { redis } from "../../redis";
import { getRank } from "../../utils/getRank";

const getQueueKey = (league: string) => `matchmaking:queue:${league}`;

export async function cleanInvalidEntries() {
  for (const league of ["mlb", "nba"]) {
    const queueKey = getQueueKey(league);
    const queue = await redis.lRange(queueKey, 0, -1);
    
    for (const entry of queue) {
      if (!entry || isNaN(parseInt(entry))) {
        await redis.lRem(queueKey, 0, entry);
      }
    }
  }
}

export async function addToQueue(userId: string, league: string) {
  const queueKey = getQueueKey(league);
  await redis.rPush(queueKey, userId.toString());
}

export async function removeFromQueue(userId: string, league: string) {
  const queueKey = getQueueKey(league);
  await redis.lRem(queueKey, 0, userId.toString());
}

export async function getPair(league: string): Promise<{
  user1: string;
  user2: string;
} | null> {
  const queueKey = getQueueKey(league);
  const queue = await redis.lRange(queueKey, 0, -1);

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
        await redis.lRem(queueKey, 0, user1);
        await redis.lRem(queueKey, 0, user2);

        return { user1, user2 };
      }
    }
  }

  return null;
}
