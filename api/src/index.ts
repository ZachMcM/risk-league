import express from "express";
import "dotenv/config";
import cors from "cors";
import bodyParser from "body-parser";
import { routes } from "./routes";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocketServer } from "./sockets";

const port = process.env.PORT;

const app = express();

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
})
initSocketServer(io)

app.use(cors());
app.use(bodyParser.json({ limit: "200mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "200mb" }));
app.use(bodyParser.text({ limit: "200mb" }));

app.use("/", routes);

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
