import express from "express";
import { usersRoute } from "./users";
import { matchesRoute } from "./matches";
import { propsRoute } from "./props";
import { parlaysRoute } from "./parlays";
import { picksRoute } from "./picks";
import { friendlyMatchRequestsRoute } from "./friendlyMatchRequests";
import { friendshipsRoute } from "./friendships";
import { gamesRoute } from "./games";

export const routes = express.Router();
routes.use(usersRoute);
routes.use(matchesRoute);
routes.use(propsRoute);
routes.use(parlaysRoute);
routes.use(picksRoute);
routes.use(friendlyMatchRequestsRoute);
routes.use(friendshipsRoute);
routes.use(gamesRoute)