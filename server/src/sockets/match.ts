import { Socket } from "socket.io";

import { eq } from "drizzle-orm";
import { logger } from "better-auth/*";
import { db } from "../db";
import { message } from "../db/schema";
import { io } from "..";
import { WebSocketRateLimiter } from "../utils/webSocketLimiter";

export async function createMessage(
  content: string,
  userId: string,
  matchId: number
) {
  logger.info("Message recieved", { messageContent: content });
  // Insert message into database
  const [newMessage] = await db
    .insert(message)
    .values({
      userId: userId,
      matchId: matchId,
      content,
    })
    .returning({ id: message.id });

  // Get user info for the message
  const messageResult = await db.query.message.findFirst({
    where: eq(message.id, newMessage.id),
    columns: {
      content: true,
      createdAt: true,
      id: true,
      userId: true,
      matchId: true,
    },
    with: {
      user: {
        columns: {
          username: true,
          id: true,
          image: true,
          points: true,
        },
      },
    },
  });

  return messageResult;
}

const messageLimiter = new WebSocketRateLimiter(1, 1000); // 5 messages per second

export function matchHandler(socket: Socket) {
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
        userId,
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
}
