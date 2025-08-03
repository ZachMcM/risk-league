import { Socket } from "socket.io";
import { io } from "..";
import { logger } from "../logger";

export function invalidationHandler(socket: Socket) {
  logger.info(`Socket connected to realtime invalidation`);
  // Handle invalidation events from engine
  socket.on("data-invalidated", (data) => {
    // Broadcast to all clients subscribed to those tables
    io.of("/invalidation").emit("data-invalidated", data);
  });
}
