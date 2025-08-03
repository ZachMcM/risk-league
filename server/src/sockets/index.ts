import { Server } from "socket.io";

import { invalidationHandler } from "./invalidation";
import { matchHandler } from "./match";
import { matchMakingHandler } from "./matchmaking";

export function socketServer(io: Server) {
  io.of("/matchmaking").on("connection", matchMakingHandler);
  io.of("/match").on("connection", matchHandler);
  io.of("/invalidation").on("connection", invalidationHandler);
}
