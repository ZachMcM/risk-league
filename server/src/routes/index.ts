import express from "express";
import { authRoute } from "./auth";
import { usersRoute } from "./users";
import { matchesRoute } from "./matches";
import { propsRoute } from "./props";
import { activeLeaguesRoute } from "./active-leagues";
import { parlaysRoute } from "./parlays";

export const routes = express.Router();
routes.use(authRoute);
routes.use(usersRoute);
routes.use(matchesRoute)
routes.use(propsRoute)
routes.use(activeLeaguesRoute)
routes.use(parlaysRoute)