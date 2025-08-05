import { io } from "..";
import { logger } from "../logger";

export function invalidateQueries(...keys: (string | number)[][]) {
  for (const key of keys) {
    logger.info(`Emitting invalidation for key: ${JSON.stringify(key)}`);
    io.of("/invalidation").emit("data-invalidated", key);
  }
}
