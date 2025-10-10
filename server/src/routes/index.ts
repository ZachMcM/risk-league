import express from "express";
import { battlePassRoute } from "./battlePass";
import { dynastyLeaguesRoute } from "./dynastyLeagues";
import { friendlyMatchRequestsRoute } from "./friendlyMatchRequests";
import { friendshipsRoute } from "./friendships";
import { gamesRoute } from "./games";
import { leaderboardRoute } from "./leaderboard";
import { matchesRoute } from "./matches";
import { parlaysRoute } from "./parlays";
import { picksRoute } from "./picks";
import { propsRoute } from "./props";
import { pushNotificationsRoute } from "./pushNotifications";
import { usersRoute } from "./users";

export const routes = express.Router();

routes.use(usersRoute);
routes.use(matchesRoute);
routes.use(propsRoute);
routes.use(parlaysRoute);
routes.use(picksRoute);
routes.use(friendlyMatchRequestsRoute);
routes.use(friendshipsRoute);
routes.use(gamesRoute);
routes.use(leaderboardRoute);
routes.use(dynastyLeaguesRoute);
routes.use(battlePassRoute);
routes.use(pushNotificationsRoute)
