import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { logger } from "./logger";
import { routes } from "./routes";
import { auth } from "./lib/auth";
import { socketServer } from "./sockets";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "./redis";
import { invalidateQueries } from "./utils/invalidateQueries";
const port = process.env.PORT;

const app = express();

app.enable("trust proxy");

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// Configure Redis adapter for Socket.IO
const pubClient = redis.duplicate();
const subClient = redis.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Socket.IO Redis adapter configured");
  })
  .catch((error) => {
    logger.error("Failed to configure Socket.IO Redis adapter:", error);
  });

const subClientForHandlers = redis.duplicate();

subClientForHandlers
  .connect()
  .then(() => {
    subClientForHandlers.subscribe("invalidate_queries", (message) => {
      try {
        const data = JSON.parse(message);
        const { keys } = data;

        if (keys && Array.isArray(keys)) {
          invalidateQueries(...keys);
        }
      } catch (error) {
        logger.error("Error handling query invalidation:", error);
      }
    });

    subClientForHandlers.subscribe("notification", (message) => {
      try {
        const { receiverIdsList, event, data } = JSON.parse(message) as {
          receiverIdsList: string[];
          event: string;
          data: any;
        };

        for (const receiverId of receiverIdsList) {
          io.of("/realtime").to(`user:${receiverId}`).emit(event, data);
        }
      } catch (error) {
        logger.error("Error handling notification message");
      }
    });

    logger.info("Redis invalidation handler configured");
  })
  .catch((error) => {
    logger.error("Failed to configure Redis invalidation handler", error);
  });

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.sendCommand(args),
  }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req) => {
    const apiKey = req.headers["x-api-key"];
    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    return apiKey === process.env.API_KEY ||
      ipAddress === process.env.DATA_FEEDS_PUSH_IP_ADDRESS
      ? Infinity
      : parseInt(process.env.MAX_REQS_PER_WINDOW!);
  }, // Limit each IP to 3000 requests per minute
  message: "Too many requests from this IP, please try again later",
  skip: (_) => {
    // Skip rate limiting if Redis is down
    return !redis.isReady;
  },
});

socketServer(io);

app.use(cors());
app.use(morgan("combined"));
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json({ limit: "10mb" }));
app.use(limiter);
app.use("/", routes);

httpServer.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
