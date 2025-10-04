import { Queue } from "bullmq";
import { logger } from "../logger";

const connection = {
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT!),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PW,
};

export const botParlayQueue = new Queue("bot-parlays", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000,
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

botParlayQueue.on("error", (error) => {
  logger.error("Bot parlay queue error:", error);
});

export interface BotParlayJobData {
  botId: string;
  matchId: number;
}
