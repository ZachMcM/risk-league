import { io } from "..";

export function invalidateQueries(...keys: (string | number)[][]) {
  for (const key of keys) {
    io.of("/invalidation").emit("data-invalidated", key);
  }
}
