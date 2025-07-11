import { Server } from "socket.io";
import { createMessage } from "./match/createMessage";
import { createMatch } from "./matchmaking/createMatch";
import { addToQueue, getPair, removeFromQueue, cleanInvalidEntries } from "./matchmaking/queue";
import { logger } from "../logger";
import { WebSocketRateLimiter } from "../utils/rateLimiter";

const messageLimiter = new WebSocketRateLimiter(1, 1000); // 5 messages per second

export function initSocketServer(io: Server) {
  io.of("/matchmaking").on("connection", (socket) => {
    const userId = socket.handshake.auth.userId as string;

    logger.info(`User ${userId} connected to matchmaking namespace`);

    socket.join(userId);

    addToQueue(userId);

    const tryMatchmaking = async () => {
      // Clean up any invalid entries first
      await cleanInvalidEntries();
      
      const pair = await getPair();

      if (pair) {
        const matchId = await createMatch({
          user1: parseInt(pair.user1),
          user2: parseInt(pair.user2),
        });

        const { user1, user2 } = pair;

        if (!matchId) {
          logger.error("Matchmaking failed due to failure to insert match");
          io.of("/matchmaking").to(user1.toString()).emit("matchmaking-failed");
          io.of("/matchmaking").to(user2.toString()).emit("matchmaking-failed");
        }

        io.of("/matchmaking")
          .to(user1.toString())
          .emit("match-found", { matchId });
        io.of("/matchmaking")
          .to(user2.toString())
          .emit("match-found", { matchId });

        logger.info(`Match found between users ${user1} and ${user2}`);
      }
    };

    tryMatchmaking();

    socket.on("disconnect", () => {
      logger.info(`User ${userId} disconnected`);
      removeFromQueue(userId as string);
    });

    socket.on("cancel-search", () => {
      logger.info(`User ${userId} cancelled search`);
      socket.disconnect();
    });
  });

  io.of("/match").on("connection", (socket) => {
    const userId = socket.handshake.auth.userId as string;
    const matchId = socket.handshake.auth.matchId as string;

    logger.debug('Socket auth params:', socket.handshake.auth);
    logger.info(`User ${userId} connected to match id ${matchId} namespace`);

    // Join both user room and match room
    socket.join(`match:${matchId}`);

    // Handle sending messages
    socket.on("send-message", async (data: { content: string }) => {
      try {
        const rateCheck = await messageLimiter.checkLimit(userId as string);

        if (!rateCheck.allowed) {
          socket.emit("message-error", {
            error: "Slow down! Too many messages!",
            retryAfter: rateCheck.retryAfter,
          });
          return;
        }

        const messageData = await createMessage(
          data.content,
          parseInt(userId as string),
          parseInt(matchId as string)
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
    logger.info(`Socket connected to realtime invalidation`)
    // Handle invalidation events from engine
    socket.on("data-invalidated", (data) => {
      // Broadcast to all clients subscribed to those tables
      io.of("/invalidation").emit("data-invalidated", data);
    });
  });
}
