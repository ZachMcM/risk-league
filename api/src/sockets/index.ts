import { Server } from "socket.io";
import { addToQueue, getPair, removeFromQueue } from "../matchmaking/queue";

export function initSocketServer(io: Server) {
  io.of("/matchmaking").on("connection", (socket) => {
    const userId = socket.handshake.query.userId as string;
    console.log(`User ${userId} connected to matchmaking namespace`);
    socket.join(userId);

    addToQueue(userId);

    const tryMatch = async () => {
      const pair = await getPair();

      if (pair) {
        const { user1, user2 } = pair;
        io.of("/matchmaking")
          .to(user1)
          .emit("match-found", { opponentId: user2 });
        io.of("/matchmaking")
          .to(user2)
          .emit("match-found", { opponentId: user1 });

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
