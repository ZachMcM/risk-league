import { and, eq, ne } from "drizzle-orm";
import {
  DEFAULT_PROFANITY,
  uniqueUsernameGenerator,
} from "unique-username-generator";
import { v4 as uuidv4 } from "uuid";
import { io } from "..";
import { getPickRequirements } from "../constants/draftRequirements";
import { db } from "../db";
import {
  leagueType,
  match,
  matchUser,
  pick,
  user,
} from "../db/schema";
import { logger } from "../logger";
import { sendPushNotification } from "../routes/pushNotifications";
import { createMatch } from "../sockets/matchmaking";
import { Rank } from "../types/ranks";
import { getAvailablePropsForUser } from "../utils/getAvailableProps";
import { getRank } from "../utils/getRank";
import { invalidateQueries } from "../utils/invalidateQueries";
import { getCombinedDictionaries } from "./usernameDictionaries";

/**
 * Creates a draft for a bot in a match by selecting props that satisfy position requirements
 */
export async function createBotDraft(botId: string, matchId: number) {
  try {
    logger.info(`Creating bot draft for bot ${botId} in match ${matchId}`);

    // Get the match and league
    const matchResult = await db.query.match.findFirst({
      where: eq(match.id, matchId),
      columns: {
        league: true,
        resolved: true,
      },
    });

    if (!matchResult || matchResult.resolved) {
      logger.warn(`Match ${matchId} not found or already resolved, skipping bot draft`);
      return;
    }

    // Get bot's matchUser record
    const botMatchUser = await db.query.matchUser.findFirst({
      where: and(
        eq(matchUser.userId, botId),
        eq(matchUser.matchId, matchId)
      ),
    });

    if (!botMatchUser) {
      logger.warn(`Bot ${botId} not found in match ${matchId}`);
      return;
    }

    // Get available props with full data
    const { props: availableProps } = await getAvailablePropsForUser({
      userId: botId,
      matchId,
      fullData: true,
    });

    if (!availableProps || availableProps.length === 0) {
      logger.warn(`No available props for bot ${botId} in match ${matchId}`);
      return;
    }

    // Get pick requirements for this league
    const requirements = getPickRequirements(matchResult.league);

    // Build the draft picks
    const draftPicks: Array<{
      propId: number;
      choice: "over" | "under";
      matchUserId: number;
    }> = [];

    const usedPropIds = new Set<number>();

    // For each position requirement, select random eligible props
    for (const requirement of requirements) {
      const eligibleProps = availableProps.filter(
        (p) =>
          requirement.eligiblePositions.includes(p.player.position) &&
          !usedPropIds.has(p.id)
      );

      if (eligibleProps.length < requirement.count) {
        logger.warn(
          `Not enough eligible props for ${requirement.name} (need ${requirement.count}, have ${eligibleProps.length})`
        );
        // Can't complete a valid draft, abort
        return;
      }

      // Randomly select the required number of props
      const selectedProps = selectRandomItems(eligibleProps, requirement.count);

      for (const selectedProp of selectedProps) {
        usedPropIds.add(selectedProp.id);

        // Randomly choose over or under
        const choice = Math.random() > 0.5 ? "over" : "under";

        draftPicks.push({
          propId: selectedProp.id,
          choice,
          matchUserId: botMatchUser.id,
        });
      }
    }

    // Insert all picks in a transaction
    await db.insert(pick).values(draftPicks);

    invalidateQueries(["match", matchId]);

    // Get the opponent to send notification
    const opponentMatchUser = await db.query.matchUser.findFirst({
      where: and(
        eq(matchUser.matchId, matchId),
        ne(matchUser.userId, botId)
      ),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
          },
        },
      },
    });

    const botUser = await db.query.user.findFirst({
      where: eq(user.id, botId),
      columns: {
        username: true,
      },
    });

    if (opponentMatchUser) {
      sendPushNotification(
        opponentMatchUser.user.id,
        "Opponent Drafted",
        `${botUser?.username || "Bot"} completed their draft with ${draftPicks.length} picks!`,
        {
          matchId,
          url: `/match/${matchId}`,
        }
      );
    }

    logger.info(
      `Bot ${botId} completed draft in match ${matchId} with ${draftPicks.length} picks`
    );
  } catch (error) {
    logger.error(
      `Failed to create bot draft for bot ${botId} in match ${matchId}:`,
      error
    );
  }
}

/**
 * Helper function to select N random items from an array without replacement
 */
function selectRandomItems<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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

      // Schedule bot draft with a random delay (10-120 seconds) to simulate human behavior
      const draftDelay = 10000 + Math.random() * 110000;
      setTimeout(() => {
        createBotDraft(botId, matchId);
      }, draftDelay);

      logger.info(
        `Created bot match ${matchId} for user ${userId} with bot ${botId}, bot will draft in ${Math.round(draftDelay / 1000)}s`
      );
    }
  } catch (error) {
    logger.error(`Failed to create bot match for user ${userId}:`, error);
    io.of("/matchmaking").to(userId).emit("matchmaking-failed");
  }
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

  await db.insert(user).values({
    id: botId,
    name: username,
    username,
    displayUsername: username,
    email: `${username}@bot.riskleague.app`,
    points: targetRank.minPoints + Math.floor(Math.random() * 50),
    isBot: true,
  });

  return botId;
}
