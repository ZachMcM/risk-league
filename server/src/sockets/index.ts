import { Server } from "socket.io";

import { matchHandler } from "./match";
import { matchMakingHandler } from "./matchmaking";
import { realtimeHandler } from "./realtime";

export function socketServer(io: Server) {
  io.of("/matchmaking").on("connection", matchMakingHandler);
  io.of("/match").on("connection", matchHandler);
  io.of("/realtime").on("connection", realtimeHandler);
}
