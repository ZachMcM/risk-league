import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { match, matchUser, message, pick, prop } from "../db/schema";
import { logger } from "../logger";
import { authMiddleware } from "../middleware";
import { calculateProgressionDelta } from "../utils/calculateProgressionDelta";
import { findRank } from "../utils/findRank";
import { handleError } from "../utils/handleError";
import { invalidateQueries } from "../utils/invalidateQueries";
import { sendPushNotification } from "./pushNotifications";

export const matchesRoute = Router();

matchesRoute.get("/matches", authMiddleware, async (req, res) => {
  try {
    const resolvedString = req.query.resolved as string | undefined;

    if (!resolvedString) {
      res
        .status(400)
        .json({ error: "Invalid query string, missing resolved query string" });
      return;
    }

    const resolved = resolvedString === "true";

    // Fetch match users with only essential user data (no picks)
    const matchUserResults = await db.query.matchUser.findMany({
      where: and(
        eq(matchUser.userId, res.locals.userId!),
        resolved
          ? ne(matchUser.status, "not_resolved")
          : eq(matchUser.status, "not_resolved")
      ),
      with: {
        match: {
          with: {
            matchUsers: {
              with: {
                user: {
                  columns: {
                    id: true,
                    username: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: desc(matchUser.createdAt),
      limit: resolved ? 50 : undefined,
    });

    // Collect all match user IDs to fetch scores in bulk
    const matchUserIds = matchUserResults.flatMap((mu) =>
      mu.match.matchUsers.map((u) => u.id)
    );

    // Fetch all scores with a single aggregated SQL query
    const scores = await db
      .select({
        matchUserId: pick.matchUserId,
        score: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${pick.choice} = 'over'
                THEN ${prop.currentValue} - ${prop.line}
                ELSE ${prop.line} - ${prop.currentValue}
              END
            ),
            0
          )
        `.as("score"),
      })
      .from(pick)
      .innerJoin(prop, eq(pick.propId, prop.id))
      .where(
        and(inArray(pick.matchUserId, matchUserIds), eq(prop.status, "resolved"))
      )
      .groupBy(pick.matchUserId);

    // Create a map for O(1) score lookups
    const scoresMap = new Map(scores.map((s) => [s.matchUserId, s.score ?? 0]));

    // Build response with computed scores
    const matchesData = matchUserResults.map(({ match }) => ({
      ...match,
      matchUsers: match.matchUsers.map((mu) => ({
        ...mu,
        score: scoresMap.get(mu.id) ?? 0,
        progressionDelta: calculateProgressionDelta(
          mu.pointsSnapshot,
          mu.pointsDelta
        ),
        rankSnapshot: findRank(mu.pointsSnapshot),
      })),
    }));

    res.json(matchesData);
  } catch (error) {
    handleError(error, res, "Matches route");
  }
});

matchesRoute.get("/matches/:id", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);

    // Validate matchId is a valid number
    if (isNaN(matchId)) {
      return res.status(400).json({ error: "Invalid matchId" });
    }

    // Fetch match with picks, but keep nested data for detail view
    const matchResult = await db.query.match.findFirst({
      where: eq(match.id, matchId),
      with: {
        matchUsers: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                image: true,
              },
            },
            picks: {
              with: {
                prop: {
                  with: {
                    player: {
                      with: {
                        team: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!matchResult) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Verify the user is part of this match
    const userIsInMatch = matchResult.matchUsers.some(
      (mu) => mu.userId === res.locals.userId
    );

    if (!userIsInMatch) {
      return res.status(403).json({ error: "Access denied to this match" });
    }

    // Calculate scores for each match user
    const matchWithScores = {
      ...matchResult,
      matchUsers: matchResult.matchUsers.map((mu) => {
        let score = 0;

        for (const pick of mu.picks) {
          if (pick.prop.status !== "resolved") {
            continue;
          }

          if (pick.choice == "over") {
            score += pick.prop.currentValue - pick.prop.line;
          } else {
            score += pick.prop.line - pick.prop.currentValue;
          }
        }

        return {
          ...mu,
          score,
          progressionDelta: calculateProgressionDelta(
            mu.pointsSnapshot,
            mu.pointsDelta
          ),
          rankSnapshot: findRank(mu.pointsSnapshot),
        };
      }),
    };

    res.json(matchWithScores);
  } catch (error) {
    handleError(error, res, "Matches route");
  }
});

matchesRoute.get("/matches/:id/messages", authMiddleware, async (req, res) => {
  try {
    const matchId = req.params.id;

    const messages = await db.query.message.findMany({
      where: eq(message.matchId, parseInt(matchId)),
      with: {
        user: {
          columns: {
            id: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy: message.createdAt,
    });

    res.json(messages);
  } catch (error) {
    handleError(error, res, "Matches route");
  }
});

matchesRoute.post("/matches/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body as {
      content: string | undefined;
    };

    if (content == undefined) {
      res
        .status(400)
        .json({ error: "Invalid request body, missing message content" });
      return;
    }

    const [newMessage] = await db
      .insert(message)
      .values({
        userId: res.locals.userId!,
        content,
        matchId: parseInt(req.params.id),
      })
      .returning({ id: message.id });

    invalidateQueries(["match", parseInt(req.params.id), "messages"]);

    const messageWithUser = await db.query.message.findFirst({
      where: eq(message.id, newMessage.id),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    });

    const otherMatchUser = await db.query.matchUser.findFirst({
      where: and(
        eq(matchUser.matchId, parseInt(req.params.id)),
        ne(matchUser.userId, res.locals.userId!)
      ),
      columns: {
        userId: true,
      },
    });

    if (!otherMatchUser) {
      res.status(500).json({ error: "No other match user found" });
      return;
    }

    sendPushNotification(
      otherMatchUser.userId,
      "Match Message",
      `${messageWithUser?.user.username || "Someone:"} ${content.substring(
        0,
        50
      )}${content.length > 50 ? "..." : ""}`,
      { url: `/match/${req.params.id}?openSubRoute=messages` }
    );

    res.json(newMessage.id);
  } catch (error) {
    handleError(error, res, "Matches route");
  }
});
