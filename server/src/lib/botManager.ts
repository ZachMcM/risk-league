import { and, eq, InferSelectModel, ne } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  DEFAULT_PROFANITY,
  uniqueUsernameGenerator,
} from "unique-username-generator";
import { io } from "..";
import { MIN_PCT_TOTAL_STAKED } from "../config";
import { db } from "../db";
import {
  cosmetic,
  leagueType,
  matchUser,
  parlay,
  pick,
  prop,
  user,
} from "../db/schema";
import { logger } from "../logger";
import { createMatch } from "../sockets/matchmaking";
import { Rank } from "../types/ranks";
import { getAvailablePropsForUser } from "../utils/getAvailableProps";
import { getRank } from "../utils/getRank";
import { getCombinedDictionaries } from "./usernameDictionaries";
import { invalidateQueries } from "../utils/invalidateQueries";
import { sendPushNotification } from "../pushNotifications";

export async function initializeBotParlays(botId: string, matchId: number) {
  logger.info(`Initializing bot parlays for bot ${botId} in match ${matchId}`);

  // First parlay: 30-90 seconds after match start
  setTimeout(() => {
    createBotParlay(botId, matchId);
  }, 30000 + Math.random() * 60000);

  // Second parlay: 3-8 minutes later
  setTimeout(() => {
    createBotParlay(botId, matchId);
  }, 180000 + Math.random() * 300000);

  // Optional third parlay: 10-15 minutes (30% chance)
  if (Math.random() < 0.05) {
    setTimeout(() => {
      createBotParlay(botId, matchId);
    }, 600000 + Math.random() * 300000);
  }
}

export async function createBotMatch(userId: string, league: string) {
  try {
    const userRank = await getRank(userId);
    if (!userRank) {
      logger.error(`Could not get rank for user ${userId}`);
      return;
    }

    const botId = await createBot(userRank);

    // User already removed from queue atomically in timer
    const matchId = await createMatch({
      user1Id: userId,
      user2Id: botId,
      league: league as (typeof leagueType.enumValues)[number],
    });

    if (matchId) {
      io.of("/matchmaking").to(userId).emit("match-found", { matchId });

      initializeBotParlays(botId, matchId);

      logger.info(
        `Created bot match ${matchId} for user ${userId} with bot ${botId}`
      );
    }
  } catch (error) {
    logger.error(`Failed to create bot match for user ${userId}:`, error);
    io.of("/matchmaking").to(userId).emit("matchmaking-failed");
  }
}

export async function createBotParlay(botId: string, matchId: number) {
  try {
    const botMatchUserRes = await db.query.matchUser.findFirst({
      where: and(
        eq(matchUser.userId, botId),
        eq(matchUser.status, "not_resolved")
      ),
    });

    if (botMatchUserRes == undefined) {
      logger.info(
        `Bot ${botId} no longer in active match ${matchId}, skipping`
      );
      return;
    }

    const balance = botMatchUserRes.balance;
    const { props: availableProps } = await getAvailablePropsForUser({
      userId: botId,
      matchId,
      fullData: true,
    });
    const minTotalStaked =
      botMatchUserRes.startingBalance * MIN_PCT_TOTAL_STAKED;

    const allParlays = await db
      .select({ stake: parlay.stake })
      .from(parlay)
      .innerJoin(matchUser, eq(parlay.matchUserId, matchUser.id))
      .where(and(eq(matchUser.userId, botId), eq(matchUser.matchId, matchId)));

    const currTotalStaked = allParlays.reduce(
      (accum, curr) => accum + curr.stake,
      0
    );

    if (
      balance > 0.1 * botMatchUserRes.startingBalance &&
      availableProps &&
      availableProps.length >= 2
    ) {
      const parlayData = generateBotParlay(
        availableProps,
        balance,
        currTotalStaked,
        minTotalStaked
      );

      await db
        .update(matchUser)
        .set({ balance: balance - parlayData.stake })
        .where(eq(matchUser.id, botMatchUserRes.id));

      const [newParlay] = await db
        .insert(parlay)
        .values({
          stake: parlayData.stake,
          type: parlayData.type,
          matchUserId: botMatchUserRes.id,
        })
        .returning({ id: parlay.id });

      // Batch insert all picks in a single operation
      const pickData = parlayData.selectedProps.map((propEntry, i) => ({
        choice: parlayData.choices[i],
        propId: propEntry.id,
        parlayId: newParlay.id,
      }));

      await db.insert(pick).values(pickData);

      invalidateQueries(["match", matchId]);

      const otherMatchUser = (await db.query.matchUser.findFirst({
        where: and(
          eq(matchUser.matchId, matchId),
          ne(matchUser.userId, botMatchUserRes.userId)
        ),
        columns: {
          id: true,
        },
        with: {
          user: {
            columns: {
              username: true,
              id: true,
              image: true,
            },
          },
        },
      }))!;

      const botAcc = await db.query.user.findFirst({
        where: eq(user.id, botId),
        columns: {
          username: true,
          image: true,
        },
      });

      io.of("/realtime")
        .to(`user:${otherMatchUser.user.id}`)
        .emit("opp-parlay-placed", {
          matchId,
          stake: parlayData.stake,
          legs: parlayData.selectedProps.length,
          type: parlayData.type,
          username: botAcc?.username,
          image: botAcc?.image,
        });

      // Send push notification
      sendPushNotification(
        otherMatchUser.user.id,
        "Opponent Parlay Placed",
        `${botAcc?.username || "Bot"} placed a ${parlayData.selectedProps.length}-leg ${parlayData.type} parlay!`,
        { matchId, stake: parlayData.stake, legs: parlayData.selectedProps.length, type: parlayData.type }
      );

      logger.info(
        `Created parlay ${newParlay.id} for bot ${botId} in match ${matchId}`
      );
    } else {
      logger.warn(`Insufficient conditions for bot parlay: balance=${balance}, 
  props=${availableProps?.length}`);
      return;
    }
  } catch (error) {
    logger.error(
      `Bot parlay creation failed for bot ${botId}, match ${matchId}`,
      error
    );
  }
}

export function generateBotParlay(
  availableProps: InferSelectModel<typeof prop>[],
  botBalance: number,
  currTotalStaked: number,
  minTotalStaked: number
): {
  type: "perfect" | "flex";
  stake: number;
  pickCount: number;
  selectedProps: InferSelectModel<typeof prop>[];
  choices: Array<"over" | "under">;
} {
  // If less than 3 available props, force perfect type with 2 picks
  if (availableProps.length < 3) {
    const selectedProps = selectRandomProps(availableProps, 2);

    let stake;

    if (currTotalStaked < minTotalStaked) {
      if (currTotalStaked == 0) {
        stake = (Math.random() * (0.7 - 0.5) + 0.5) * minTotalStaked;
      } else {
        const minNeeded = minTotalStaked - currTotalStaked;
        const availableBalance = botBalance - minNeeded;

        // Weighted distribution: 70% chance small (0-30%), 20% medium (30-60%), 10% large (60-90%)
        const rand = Math.random();
        let multiplier;

        if (rand < 0.7) {
          // Small stake: 0-30% of available balance
          multiplier = Math.random() * 0.3;
        } else if (rand < 0.9) {
          // Medium stake: 30-60% of available balance
          multiplier = 0.3 + Math.random() * 0.3;
        } else {
          // Large stake: 60-90% of available balance
          multiplier = 0.6 + Math.random() * 0.3;
        }

        stake = minNeeded + (availableBalance * multiplier);
      }
    } else {
      stake = Math.floor(botBalance * (0.2 + Math.random() * 0.4));
    }

    return {
      type: "perfect",
      stake,
      pickCount: 2,
      selectedProps,
      choices: selectedProps.map((prop) =>
        prop.choices.length == 1
          ? prop.choices[0]
          : Math.random() > 0.5
          ? "over"
          : "under"
      ) as Array<"over" | "under">,
    };
  }

  // Determine parlay type first, then pick count based on type preference
  const typeRand = Math.random();
  const type: "perfect" | "flex" = typeRand < 0.5 ? "perfect" : "flex";

  let pickCount: number;

  if (type === "perfect") {
    // Perfect parlays favor low legs (2-3): 70% chance for 2-3, 30% for 4-6
    const perfectRand = Math.random();
    if (perfectRand < 0.7) {
      // 2-3 legs (weighted toward lower)
      pickCount = Math.random() < 0.6 ? 2 : 3;
    } else {
      // 4-6 legs
      pickCount = 4 + Math.floor(Math.random() * 3);
    }
  } else {
    // Flex parlays favor high legs (4-6): 30% chance for 2-3, 70% for 4-6
    const flexRand = Math.random();
    if (flexRand < 0.3) {
      // 2-3 legs
      pickCount = Math.random() < 0.5 ? 2 : 3;
    } else {
      // 4-6 legs (weighted toward higher)
      const highLegRand = Math.random();
      if (highLegRand < 0.4) {
        pickCount = 4;
      } else if (highLegRand < 0.7) {
        pickCount = 5;
      } else {
        pickCount = 6;
      }
    }
  }

  if (pickCount > availableProps.length) {
    pickCount = availableProps.length;
  }
  const selectedProps = selectRandomProps(availableProps, pickCount);

  let stake;

  if (currTotalStaked < minTotalStaked) {
    if (currTotalStaked == 0) {
      stake = (Math.random() * (0.7 - 0.5) + 0.5) * minTotalStaked;
    } else {
      const minNeeded = minTotalStaked - currTotalStaked;
      const availableBalance = botBalance - minNeeded;

      // Weighted distribution: 70% chance small (0-30%), 20% medium (30-60%), 10% large (60-90%)
      const rand = Math.random();
      let multiplier;

      if (rand < 0.7) {
        // Small stake: 0-30% of available balance
        multiplier = Math.random() * 0.3;
      } else if (rand < 0.9) {
        // Medium stake: 30-60% of available balance
        multiplier = 0.3 + Math.random() * 0.3;
      } else {
        // Large stake: 60-90% of available balance
        multiplier = 0.6 + Math.random() * 0.3;
      }

      stake = minNeeded + (availableBalance * multiplier);
    }
  } else {
    stake = Math.floor(botBalance * (0.2 + Math.random() * 0.4));
  }

  return {
    type,
    stake,
    pickCount,
    selectedProps,
    choices: selectedProps.map((prop) =>
      prop.choices.length == 1
        ? prop.choices[0]
        : Math.random() > 0.5
        ? "over"
        : "under"
    ) as Array<"over" | "under">,
  };
}

function selectRandomProps(
  availableProps: InferSelectModel<typeof prop>[],
  pickCount: number
) {
  const res = [];
  const prevIndexes: number[] = [];

  for (let i = 0; i < pickCount; i++) {
    let randomIndex = Math.floor(Math.random() * availableProps.length);
    while (prevIndexes.includes(randomIndex)) {
      randomIndex = Math.floor(Math.random() * availableProps.length);
    }

    res.push(availableProps[randomIndex]);
  }

  return res;
}

export async function createBot(targetRank: Rank): Promise<string> {
  const caseStyles = [
    "camelCase",
    "pascalCase",
    "kebabCase",
    "snakeCase",
    "titleCase",
  ] as const;

  const botId = uuidv4();
  const [combinedAdjectives, combinedNouns] = getCombinedDictionaries();

  const username = uniqueUsernameGenerator({
    dictionaries: [combinedAdjectives, combinedNouns],
    profanityList: DEFAULT_PROFANITY,
    style: caseStyles[Math.floor(Math.random() * caseStyles.length)],
  });

  const allDefaultCosmetics = await db.query.cosmetic.findMany({
    where: eq(cosmetic.isDefault, true),
  });

  const defaultImages = allDefaultCosmetics
    .filter((dc) => dc.type == "image")
    .map((image) => image.url);
  const defaultBanners = allDefaultCosmetics
    .filter((dc) => dc.type == "banner")
    .map((banner) => banner.url);

  await db.insert(user).values({
    id: botId,
    name: username,
    username,
    displayUsername: username,
    email: `${username}@bot.riskleague.app`,
    points: targetRank.minPoints + Math.floor(Math.random() * 50),
    isBot: true,
    image: defaultImages[Math.floor(Math.random() * defaultImages.length)],
    banner: defaultBanners[Math.floor(Math.random() * defaultBanners.length)],
  });

  return botId;
}
