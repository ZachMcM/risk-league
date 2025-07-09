import express from "express";
import { authRoute } from "./auth";
import { usersRoute } from "./users";
import { scoreboard } from "./scoreboard";
import { matchesRoute } from "./matches";
import { propsRouter } from "./props";

export const routes = express.Router();
routes.use(authRoute);
routes.use(usersRoute);
routes.use(scoreboard)
routes.use(matchesRoute)
routes.use(propsRouter)


