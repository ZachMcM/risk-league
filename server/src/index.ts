import bodyParser from "body-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import { logger } from "./logger";
import { routes } from "./routes";
import { initSocketServer } from "./sockets";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "./redis";

// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS!),
//   limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!),
//   standardHeaders: "draft-8",
//   legacyHeaders: false,
//   store: new RedisStore({
//     sendCommand: (...args: string[]) => redis.sendCommand(args),
//   }),
//   validate: { xForwardedForHeader: process.env.X_FORWARDED_FOR == "true" },
// });

const port = process.env.PORT;

const app = express();

app.enable("trust proxy")

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// Make io instance globally accessible
export { io };

initSocketServer(io);

app.use(cors());
app.use(morgan("combined"));
app.use(bodyParser.json({ limit: "200mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "200mb" }));
app.use(bodyParser.text({ limit: "200mb" }));

app.use("/", routes);

httpServer.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
