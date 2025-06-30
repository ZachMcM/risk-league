import { Server } from "socket.io";
import { addToQueue, getPair, removeFromQueue } from "./matchmaking/queue";
import { createMatch } from "./matchmaking/createMatch";
import { db } from "../db/db";

export function initSocketServer(io: Server) {
  io.of("/matchmaking").on("connection", (socket) => {
    const userId = socket.handshake.query.userId as string;
    console.log(`User ${userId} connected to matchmaking namespace`);
    socket.join(userId);

    addToQueue(userId);

    const tryMatch = async () => {
      const pair = await getPair();

      if (pair) {
        const matchId = await createMatch(pair);

        const { user1, user2 } = pair;

        if (!matchId) {
          console.log("Matchmaking failed due to failure to insert match");
          io.of("/matchmaking").to(user1).emit("matchmaking-failed");
          io.of("/matchmaking").to(user2).emit("matchmaking-failed");
        }

        io.of("/matchmaking").to(user1).emit("match-found", { matchId });
        io.of("/matchmaking").to(user2).emit("match-found", { matchId });

        console.log(`Match found between users ${user1} and ${user2}`);
      }
    };

    tryMatch();

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
      removeFromQueue(userId);
    });

    socket.on("cancel-search", () => {
      console.log(`User ${userId} cancelled search`);
      socket.disconnect();
    });
  });

  io.of("/match").on("connection", (socket) => {
    const userId = socket.handshake.query.userId as string;
    const matchId = socket.handshake.query.matchId as string;
    console.log(`User ${userId} connected to match id ${matchId} namespace`);

    // Join both user room and match room
    socket.join(userId);
    socket.join(`match:${matchId}`);

    // Handle sending messages
    socket.on("send-message", async (data: { content: string }) => {
      try {
        // Insert message into database
        const newMessage = await db
          .insertInto("match_messages")
          .values({
            user_id: userId,
            match_id: matchId,
            content: data.content,
          })
          .returning(["id", "created_at"])
          .executeTakeFirstOrThrow();

        // Get user info for the message
        const user = await db
          .selectFrom("users")
          .select(["username", "image"])
          .where("id", "=", userId)
          .executeTakeFirstOrThrow();

        const messageData = {
          id: newMessage.id,
          userId,
          username: user.username,
          image: user.image,
          content: data.content,
          createdAt: newMessage.created_at,
        };

        // Broadcast to all users in the match room
        io.of("/match")
          .to(`match:${matchId}`)
          .emit("message-received", messageData);

        console.log(`Message sent in match ${matchId} by user ${userId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message-error", { error: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected from match ${matchId}`);
    });
  });
}
