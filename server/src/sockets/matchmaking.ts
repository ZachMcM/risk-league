import { eq } from "drizzle-orm";
import { Socket } from "socket.io";
import { io } from "..";
import {
  BOT_TIMER_MS,
  MAX_STARTING_BALANCE,
  MIN_STARTING_BALANCE,
} from "../config";
import { db } from "../db";
import { leagueType, match, matchUser, user } from "../db/schema";
import { logger } from "../logger";
import { redis } from "../redis";
import { createBotMatch } from "../lib/botManager";
import { getRank } from "../utils/getRank";
import { invalidateQueries } from "../utils/invalidateQueries";

export async function createMatch({
  user1Id,
  user2Id,
  league,
  type = "competitive",
}: {
  user1Id: string;
  user2Id: string;
  league: (typeof leagueType.enumValues)[number];
  type?: string;
}) {
  const startingBalance = Math.round(
    MIN_STARTING_BALANCE +
      Math.random() * (MAX_STARTING_BALANCE - MIN_STARTING_BALANCE)
  );

  const [matchResult] = await db
    .insert(match)
    .values({ resolved: false, league, type })
    .returning({ id: match.id });

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
    startingBalance,
    balance: startingBalance,
    userId: user1Id,
    matchId: matchResult.id,
  });

  await db.insert(matchUser).values({
    pointsSnapshot: user2Points,
    startingBalance,
    balance: startingBalance,
    userId: user2Id,
    matchId: matchResult.id,
  });

  invalidateQueries(
    ["match-ids", user1Id, "unresolved"],
    ["match-ids", user2Id, "unresolved"]
  );

  return matchResult.id;
}

const getQueueKey = (league: string) => `matchmaking:queue:${league}`;

export async function cleanInvalidEntries() {
  for (const league of ["mlb", "nba", "nfl", "mccb", "cfb"]) {
    const queueKey = getQueueKey(league);
    const queue = await redis.lRange(queueKey, 0, -1);

    for (const entry of queue) {
      if (!entry || entry.trim() === "") {
        await redis.lRem(queueKey, 0, entry);
      }
    }
  }
}

export async function addToQueue(userId: string, league: string) {
  const queueKey = getQueueKey(league);
  await redis.rPush(queueKey, userId);
}

export async function removeFromQueue(userId: string, league: string) {
  const queueKey = getQueueKey(league);
  await redis.lRem(queueKey, 0, userId);
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
        user1Rank?.tier === user2Rank?.tier &&
        user1Rank?.level === user2Rank?.level
      ) {
        await redis.lRem(queueKey, 0, user1);
        await redis.lRem(queueKey, 0, user2);

        return { user1, user2 };
      }
    }
  }

  return null;
}

export async function matchMakingHandler(socket: Socket) {
  const userId = socket.handshake.auth.userId as string | undefined;
  const league = socket.handshake.auth.league as string | undefined;

  if (league == undefined || !leagueType.enumValues.includes(league as any)) {
    socket.emit("error", { message: "Invalid or missing league" });
    socket.disconnect();
    return;
  }

  if (userId == undefined) {
    socket.emit("error", { message: "Missing userId" });
    socket.disconnect();
    return;
  }

  logger.info(
    `User ${userId} connected to matchmaking namespace for ${league}`
  );

  socket.join(userId);
  socket.join(`league:${league}`);

  await addToQueue(userId, league);

  const botTimer = setTimeout(async () => {
    // Use atomic operation to check and remove user from queue
    const queueKey = getQueueKey(league);
    const removedCount = await redis.lRem(queueKey, 1, userId);

    // Only create bot match if user was actually in queue
    if (removedCount > 0) {
      logger.info(
        `User ${userId} waited ${BOT_TIMER_MS / 1000}s, creating bot match`
      );
      await createBotMatch(userId, league);
    }
  }, BOT_TIMER_MS);

  const tryMatchmaking = async () => {
    // Clean up any invalid entries first
    await cleanInvalidEntries();

    const pair = await getPair(league);

    if (pair) {
      clearTimeout(botTimer);

      const matchId = await createMatch({
        user1Id: pair.user1,
        user2Id: pair.user2,
        league: league as (typeof leagueType.enumValues)[number],
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
    clearTimeout(botTimer);
    removeFromQueue(userId, league);
  });

  socket.on("cancel-search", () => {
    logger.info(`User ${userId} cancelled search`);
    clearTimeout(botTimer);
    removeFromQueue(userId, league);
    socket.disconnect();
  });
}
