import { Router } from "express";
import { basketballRoute } from "./basketball";
import { footballRoute } from "./football";
import { baseballRoute } from "./baseball";

export const statsRoute = Router()

statsRoute.use(basketballRoute)
statsRoute.use(footballRoute)
statsRoute.use(baseballRoute)