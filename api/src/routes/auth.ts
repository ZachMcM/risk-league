import { NextFunction, Router, Request, Response } from "express";
import bycrpt from "bcrypt";
import { createSession } from "../utils/createSession";
import jwt from "jsonwebtoken";

export const authRoute = Router();

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("Authenticating...");
  // TODO
}

authRoute.get("/auth/session", authMiddleware, async (req, res) => {
  // TODO
})

authRoute.post("/auth/login", async (req, res) => {
  // TODO
})

authRoute.post("/auth/register", async (req, res) => {
  // TODO
});



