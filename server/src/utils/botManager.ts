import { InferSelectModel } from "drizzle-orm";
import { prop } from "../db/schema";

export function generateBotParlay(availableProps: InferSelectModel<typeof prop>[], botBalance: number) {
  return {
    type: Math.random() > 0.5 ? "perfect" : "flex",
    stake: Math.floor(botBalance * (0.2 + Math.random() * 0.4)),
    pickCount: 2 + Math.floor(Math.random() * 4),
    // TODO selectedProps: 
    // TODO choices:
  }
}