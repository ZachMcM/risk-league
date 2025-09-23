import { redis } from "../redis";

export class WebSocketRateLimiter {
  private maxMessages: number;
  private windowMs: number;
  private keyPrefix: string;

  constructor(
    maxMessages: number = 5,
    windowMs: number = 1000,
    keyPrefix: string = "ws_rate_limit"
  ) {
    this.maxMessages = maxMessages;
    this.windowMs = windowMs;
    this.keyPrefix = keyPrefix;
  }

  async checkLimit(
    identifier: string
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = `${this.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old entries and count current messages
    await redis.zRemRangeByScore(key, 0, windowStart);
    const currentCount = await redis.zCard(key);

    if (currentCount >= this.maxMessages) {
      // Get the oldest message timestamp to calculate retry time
      const oldestMessage = await redis.zRange(key, 0, 0, { REV: false });
      const retryAfter =
        oldestMessage.length > 0
          ? parseInt(oldestMessage[0]) + this.windowMs - now
          : this.windowMs;

      return { allowed: false, retryAfter: Math.max(retryAfter, 0) };
    }

    // Add current message timestamp
    await redis.zAdd(key, { score: now, value: now.toString() });
    await redis.expire(key, Math.ceil(this.windowMs / 1000));

    return { allowed: true };
  }
}
