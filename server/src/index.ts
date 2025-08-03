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

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use("/", routes);

httpServer.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
