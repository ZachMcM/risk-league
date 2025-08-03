import { Socket } from "socket.io";
import { io } from "..";
import { logger } from "../logger";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { match, matchUser, user } from "../db/schema";
import { redis } from "../redis";
import { getRank } from "../utils/getRank";

export async function createMatch({
  user1Id,
  user2Id,
  league,
}: {
  user1Id: string;
  user2Id: string;
  league: string;
}) {
  const [matchResult] = await db
    .insert(match)
    .values({ resolved: false, league })
    .returning({ id: match.id });

  // TODO add randomzied starting balances

  const { points: user1Points } = (
    await db
      .select({ points: user.points })
      .from(user)
      .where(eq(user.id, user1Id))
      .limit(1)
  )[0];
  const { points: user2Points } = (
    await db
      .select({ points: user.points })
      .from(user)
      .where(eq(user.id, user2Id))
      .limit(1)
  )[0];

  await db.insert(matchUser).values({
    pointsSnapshot: user1Points,
    userId: user1Id,
    matchId: matchResult.id,
  });

  await db.insert(matchUser).values({
    pointsSnapshot: user2Points,
    userId: user2Id,
    matchId: matchResult.id,
  });

  return matchResult.id;
}

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
    const user1Rank = await getRank(user1);

    for (let j = i + 1; j < queue.length; j++) {
      const user2 = queue[j];
      const user2Rank = await getRank(user2);

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

export function matchMakingHandler(socket: Socket) {
  const userId = socket.handshake.auth.userId;
  const league = socket.handshake.auth.league;

  if (!league) {
    socket.emit("error", { message: "Invalid or missing league" });
    socket.disconnect();
    return;
  }

  logger.info(
    `User ${userId} connected to matchmaking namespace for ${league}`
  );

  socket.join(userId);
  socket.join(`league:${league}`);

  addToQueue(userId, league);

  const tryMatchmaking = async () => {
    // Clean up any invalid entries first
    await cleanInvalidEntries();

    const pair = await getPair(league);

    if (pair) {
      const matchId = await createMatch({
        user1Id: pair.user1,
        user2Id: pair.user2,
        league,
      });

      const { user1, user2 } = pair;

      if (!matchId) {
        logger.error("Matchmaking failed due to failure to insert match");
        io.of("/matchmaking").to(user1).emit("matchmaking-failed");
        io.of("/matchmaking").to(user2).emit("matchmaking-failed");
      } else {
        io.of("/matchmaking").to(user1).emit("match-found", { matchId });
        io.of("/matchmaking").to(user2).emit("match-found", { matchId });

        logger.info(`Match found between users ${user1} and ${user2}`);
      }
    }
  };

  tryMatchmaking();

  socket.on("disconnect", () => {
    logger.info(`User ${userId} disconnected`);
    removeFromQueue(userId, league);
  });

  socket.on("cancel-search", () => {
    logger.info(`User ${userId} cancelled search`);
    socket.disconnect();
  });
}
