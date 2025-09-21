import { io } from "..";
import { logger } from "../logger";

export function invalidateQueries(...keys: (string | number)[][]) {
  for (const key of keys) {
    io.of("/realtime").emit("data-invalidated", key);
  }
}
