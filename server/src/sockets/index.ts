import { Server } from "socket.io";
import { createMessage } from "./match/createMessage";
import { createMatch } from "./matchmaking/createMatch";
import {
  addToQueue,
  getPair,
  removeFromQueue,
  cleanInvalidEntries,
} from "./matchmaking/queue";
import { logger } from "../logger";
import { WebSocketRateLimiter } from "../utils/rateLimiter";
import { matchGameMode } from "../drizzle/schema";

const messageLimiter = new WebSocketRateLimiter(1, 1000); // 5 messages per second

export function initSocketServer(io: Server) {
  io.of("/matchmaking").on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;
    const gameMode = socket.handshake.auth.gameMode;

    if (!gameMode || !matchGameMode.enumValues.includes(gameMode as any)) {
      socket.emit("error", { message: "Invalid or missing gameMode" });
      socket.disconnect();
      return;
    }

    logger.info(
      `User ${userId} connected to matchmaking namespace for ${gameMode}`
    );

    socket.join(userId);
    socket.join(`gameMode:${gameMode}`);

    addToQueue(userId, gameMode as (typeof matchGameMode.enumValues)[number]);

    const tryMatchmaking = async () => {
      // Clean up any invalid entries first
      await cleanInvalidEntries();

      const pair = await getPair(
        gameMode as (typeof matchGameMode.enumValues)[number]
      );

      if (pair) {
        const matchId = await createMatch({
          user1: parseInt(pair.user1),
          user2: parseInt(pair.user2),
          gameMode: gameMode as (typeof matchGameMode.enumValues)[number],
        });

        const { user1, user2 } = pair;

        if (!matchId) {
          logger.error("Matchmaking failed due to failure to insert match");
          io.of("/matchmaking").to(user1).emit("matchmaking-failed");
          io.of("/matchmaking").to(user2).emit("matchmaking-failed");
        } else {
          io.of("/matchmaking")
            .to(user1)
            .emit("match-found", { matchId });
          io.of("/matchmaking")
            .to(user2)
            .emit("match-found", { matchId });

          logger.info(`Match found between users ${user1} and ${user2}`);
        }
      }
    };

    tryMatchmaking();

    socket.on("disconnect", () => {
      logger.info(`User ${userId} disconnected`);
      removeFromQueue(
        userId,
        gameMode as (typeof matchGameMode.enumValues)[number]
      );
    });

    socket.on("cancel-search", () => {
      logger.info(`User ${userId} cancelled search`);
      socket.disconnect();
    });
  });

  io.of("/match").on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;
    const matchId = socket.handshake.auth.matchId;

    logger.debug("Socket auth params:", socket.handshake.auth);
    logger.info(`User ${userId} connected to match id ${matchId} namespace`);

    // Join both user room and match room
    socket.join(`match:${matchId}`);

    // Handle sending messages
    socket.on("send-message", async (data: { content: string }) => {
      try {
        const rateCheck = await messageLimiter.checkLimit(userId);

        if (!rateCheck.allowed) {
          socket.emit("message-error", {
            error: "Slow down! Too many messages!",
            retryAfter: rateCheck.retryAfter,
          });
          return;
        }

        const messageData = await createMessage(
          data.content,
          parseInt(userId),
          parseInt(matchId)
        );
        // Broadcast to all users in the match room
        io.of("/match")
          .to(`match:${matchId}`)
          .emit("message-received", messageData);

        logger.info(`Message sent in match ${matchId} by user ${userId}`);
      } catch (error: any) {
        logger.error("Error sending message:", error);
        socket.emit("message-error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      logger.info(`User ${userId} disconnected from match ${matchId}`);
    });
  });

  io.of("/invalidation").on("connection", (socket) => {
    logger.info(`Socket connected to realtime invalidation`);
    // Handle invalidation events from engine
    socket.on("data-invalidated", (data) => {
      // Broadcast to all clients subscribed to those tables
      io.of("/invalidation").emit("data-invalidated", data);
    });
  });
}
