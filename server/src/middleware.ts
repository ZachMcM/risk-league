import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import { auth } from "./utils/auth";
import multer from "multer";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.locals.userId = session.user.id;
  next();
};

export const apiKeyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
};

export const apiKeyOrIpAddressMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"];
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (
    apiKey != process.env.API_KEY ||
    ipAddress != process.env.DATA_FEEDS_PUSH_IP_ADDRESS
  ) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fieldSize: 1000 * 1024 * 1024 }
})