import { Server } from "socket.io";
import { addToQueue, getPair, removeFromQueue } from "./matchmaking/queue";
import { createMatch } from "./matchmaking/createMatch";

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
    console.log(`User ${userId} connected to match namespace`);
  });
}
