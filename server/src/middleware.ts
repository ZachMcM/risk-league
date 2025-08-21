import { NextFunction, Request, Response } from "express";
import { auth } from "./utils/auth";
import { fromNodeHeaders } from "better-auth/node";
import { logger } from "./logger";

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

export const corsOrApiKeyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO add datafeeds domain
  logger.info({ body: req.body })

  const allowedDomains = [""];

  const origin = req.headers.origin;
  logger.info(`Origin: ${origin}`)
  const corsValid = origin && allowedDomains.includes(origin);

  const apiKey = req.headers["x-api-key"];
  const apiKeyValid = apiKey === process.env.API_KEY;

  if (corsValid || apiKeyValid) {
    next();
    return;
  }

  res.status(403).json({
    error: "Access denied: Invalid origin and missing/invalid API key",
  });
};
