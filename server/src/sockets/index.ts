import { Server } from "socket.io";
import { createMessage } from "./match/createMessage";
import { createMatch } from "./matchmaking/createMatch";
import { addToQueue, getPair, removeFromQueue } from "./matchmaking/queue";

export function initSocketServer(io: Server) {
  io.of("/matchmaking").on("connection", (socket) => {
    const userId = socket.handshake.query.userId as string;
    console.log(`User ${userId} connected to matchmaking namespace`);
    socket.join(userId);

    addToQueue(userId);

    const tryMatchmaking = async () => {
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

    tryMatchmaking();

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
    socket.join(`match:${matchId}`);

    // Handle sending messages
    socket.on("send-message", async (data: { content: string }) => {
      try {
        const messageData = createMessage(data.content, userId, matchId);
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

  io.of("/parlay_pick").on("connection", (socket) => {
    const parlayPickId = socket.handshake.query.parlayPickId as string
    console.log(`User connected to parlayPick id ${parlayPickId} namespace`);

    socket.join(`parlayPick:${parlayPickId}`)
  })
}
