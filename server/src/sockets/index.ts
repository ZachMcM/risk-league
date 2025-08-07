import { Server } from "socket.io";

import { matchMakingHandler } from "./matchmaking";
import { realtimeHandler } from "./realtime";

export function socketServer(io: Server) {
  io.of("/matchmaking").on("connection", matchMakingHandler);
  io.of("/realtime").on("connection", realtimeHandler);
}
