import { Router } from "express";
import { authMiddleware } from "./auth";

export const propsRouter = Router();

propsRouter.get("/props", authMiddleware, async (req, res) => {

})
