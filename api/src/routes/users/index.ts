import { Router } from "express";
import { ranksRoute } from "./ranks";

export const usersRoute = Router()
usersRoute.use(ranksRoute)