import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import { logger } from "./logger";
import { routes } from "./routes";
<<<<<<< HEAD
import { auth } from "./utils/auth";
import { socketServer } from "./sockets";
=======
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

>>>>>>> 49a7b3900bee74278d8981ebf95157afb1a4d8da
const port = process.env.PORT;

const app = express();

app.enable("trust proxy");

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

socketServer(io);

<<<<<<< HEAD
app.all("/api/auth/*", toNodeHandler(auth));
=======
initSocketServer(io);

>>>>>>> 49a7b3900bee74278d8981ebf95157afb1a4d8da
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use("/", routes);

httpServer.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
