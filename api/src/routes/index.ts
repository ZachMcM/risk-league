import express from "express";
import { authRoute } from "./auth";
import { usersRoute } from "./users";

export const routes = express.Router();
routes.use(authRoute);
routes.use(usersRoute);
