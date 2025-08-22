import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import { logger } from "./logger";
import { routes } from "./routes";
import { auth } from "./utils/auth";
import { socketServer } from "./sockets";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "./redis";
const port = process.env.PORT;

const app = express();

app.enable("trust proxy");

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.sendCommand(args),
  }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req) => {
    const apiKey = req.headers["x-api-key"];
    return apiKey === process.env.API_KEY
      ? 100000
      : parseInt(process.env.MAX_REQS_PER_WINDOW!);
  }, // Limit each IP to 3000 requests per minute
  message: "Too many requests from this IP, please try again later",
});

socketServer(io);

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(limiter);
app.use("/", routes);

httpServer.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
