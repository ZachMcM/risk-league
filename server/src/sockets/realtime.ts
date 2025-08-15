import { Socket } from "socket.io";
import { logger } from "../logger";

export function realtimeHandler(socket: Socket) {
  const userId = socket.handshake.auth.userId;
  socket.join(`user:${userId}`);

  logger.info(`User ${userId} connected to realtime socket`);

  socket.on("disconnect", () => {
    logger.info(`User ${userId} disconnected from realtime socket`);
  });
}
