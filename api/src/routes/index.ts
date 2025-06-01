import express from "express";
import { authRoute } from "./auth";

export const routes = express.Router();
routes.use(authRoute);
