import { eq } from "drizzle-orm";
import { Socket } from "socket.io";
import { io } from "..";
import {
  BOT_TIMER_MS,
} from "../config";
import { db } from "../db";
import { leagueType, match, matchUser, user } from "../db/schema";
import { createBotMatch } from "../lib/botManager";
import { logger } from "../logger";
import { redis } from "../redis";
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
  // Check if either user is already in an unresolved match
  const existingMatches = await db
    .select({ userId: matchUser.userId })
    .from(matchUser)
    .innerJoin(match, eq(matchUser.matchId, match.id))
    .where(eq(match.resolved, false));

  const usersInMatches = new Set(existingMatches.map((m) => m.userId));

  if (usersInMatches.has(user1Id) || usersInMatches.has(user2Id)) {
    logger.warn(
      `Attempted to create match with users already in unresolved matches: ${user1Id}, ${user2Id}`
    );
    return null;
  }

  const draftEndTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const [matchResult] = await db
    .insert(match)
    .values({ resolved: false, league, type, draftEndTime })
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
    userId: user1Id,
    matchId: matchResult.id,
  });

  await db.insert(matchUser).values({
    pointsSnapshot: user2Points,
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

// Store bot timers by userId to allow clearing them when matches are found
const botTimers = new Map<string, NodeJS.Timeout>();

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
        // Atomically remove both users - only proceed if BOTH were actually in the queue
        const user1Removed = await redis.lRem(queueKey, 1, user1);
        const user2Removed = await redis.lRem(queueKey, 1, user2);

        // If both users were successfully removed, we have a valid pair
        if (user1Removed > 0 && user2Removed > 0) {
          return { user1, user2 };
        }

        // If only one was removed, put them back in the queue
        if (user1Removed > 0) {
          await redis.rPush(queueKey, user1);
        }
        if (user2Removed > 0) {
          await redis.rPush(queueKey, user2);
        }

        // Continue searching for other pairs
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
      botTimers.delete(userId);
    }
  }, BOT_TIMER_MS);

  // Store the timer so we can clear it if a match is found
  botTimers.set(userId, botTimer);

  const tryMatchmaking = async () => {
    // Clean up any invalid entries first
    await cleanInvalidEntries();

    const pair = await getPair(league);

    if (pair) {
      const { user1, user2 } = pair;

      // Clear bot timers for both matched users to prevent double-matching
      const user1Timer = botTimers.get(user1);
      const user2Timer = botTimers.get(user2);

      if (user1Timer) {
        clearTimeout(user1Timer);
        botTimers.delete(user1);
      }
      if (user2Timer) {
        clearTimeout(user2Timer);
        botTimers.delete(user2);
      }

      const matchId = await createMatch({
        user1Id: pair.user1,
        user2Id: pair.user2,
        league: league as (typeof leagueType.enumValues)[number],
      });

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
    const timer = botTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      botTimers.delete(userId);
    }
    removeFromQueue(userId, league);
  });

  socket.on("cancel-search", () => {
    logger.info(`User ${userId} cancelled search`);
    const timer = botTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      botTimers.delete(userId);
    }
    removeFromQueue(userId, league);
    socket.disconnect();
  });
}
