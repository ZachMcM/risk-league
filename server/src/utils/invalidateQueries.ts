import { io } from "..";

export function invalidateQueries(...keys: any[]) {
  for (const key of keys) {
    io.of("/invalidation").emit("data-invalidated", key);
  }
}
