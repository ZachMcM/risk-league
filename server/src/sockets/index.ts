import { Server } from "socket.io";
import { createMessage } from "./match/createMessage";
import { createMatch } from "./matchmaking/createMatch";
import { addToQueue, getPair, removeFromQueue } from "./matchmaking/queue";
import { logger } from "../logger";
import { WebSocketRateLimiter } from "../utils/rateLimiter";

const messageLimiter = new WebSocketRateLimiter(1, 1000); // 5 messages per second

export function initSocketServer(io: Server) {
  io.of("/matchmaking").on("connection", (socket) => {
    const userId = socket.handshake.query.userId as string;
    logger.info(`User ${userId} connected to matchmaking namespace`);

    socket.join(userId);

    addToQueue(userId);

    const tryMatchmaking = async () => {
      const pair = await getPair();

      if (pair) {
        const matchId = await createMatch(pair);

        const { user1, user2 } = pair;

        if (!matchId) {
          logger.error("Matchmaking failed due to failure to insert match");
          io.of("/matchmaking").to(user1).emit("matchmaking-failed");
          io.of("/matchmaking").to(user2).emit("matchmaking-failed");
        }

        io.of("/matchmaking").to(user1).emit("match-found", { matchId });
        io.of("/matchmaking").to(user2).emit("match-found", { matchId });

        logger.info(`Match found between users ${user1} and ${user2}`);
      }
    };

    tryMatchmaking();

    socket.on("disconnect", () => {
      logger.info(`User ${userId} disconnected`);
      removeFromQueue(userId);
    });

    socket.on("cancel-search", () => {
      logger.info(`User ${userId} cancelled search`);
      socket.disconnect();
    });
  });

  io.of("/match").on("connection", (socket) => {
    const userId = socket.handshake.query.userId as string;
    const matchId = socket.handshake.query.matchId as string;
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
            retryAfter: rateCheck.retryAfter 
          });
          return;
        }

        const messageData = await createMessage(data.content, userId, matchId);
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

  io.of("/parlay_pick").on("connection", (socket) => {
    const parlayPickId = socket.handshake.query.parlay_pick_id as string;
    logger.info(`User connected to parlay pick id ${parlayPickId} namespace`);

    socket.join(`parlayPick:${parlayPickId}`);
  });

  io.of("/parlay").on("connection", (socket) => {
    const parlayId = socket.handshake.query.parlay_id as string;
    logger.info(`User connected to parlay id ${parlayId} namespace`);
  });
}
