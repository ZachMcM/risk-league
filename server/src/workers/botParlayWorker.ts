import { Worker, Job } from "bullmq";
import { logger } from "../logger";
import { createBotParlay } from "../lib/botManager";
import { BotParlayJobData } from "../queues/botParlayQueue";

const connection = {
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT!),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PW,
};

export const botParlayWorker = new Worker<BotParlayJobData>(
  "bot-parlays",
  async (job: Job<BotParlayJobData>) => {
    const { botId, matchId } = job.data;
    logger.info(
      `Processing bot parlay job for bot ${botId} in match ${matchId}`
    );

    await createBotParlay(botId, matchId);
  },
  {
    connection,
    concurrency: 100, // High concurrency for I/O-bound DB operations
  }
);

botParlayWorker.on("completed", (job) => {
  logger.info(`Bot parlay job ${job.id} completed successfully`);
});

botParlayWorker.on("failed", (job, error) => {
  logger.error(`Bot parlay job ${job?.id} failed:`, error);
});

botParlayWorker.on("error", (error) => {
  logger.error("Bot parlay worker error:", error);
});

logger.info("Bot parlay worker initialized");
