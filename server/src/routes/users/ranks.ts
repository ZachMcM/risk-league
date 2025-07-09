import { Router } from "express";
import { getRank } from "../../utils/getRank";
import { authMiddleware } from "../auth";
import { logger } from "../../logger";

export const ranksRoute = Router();

ranksRoute.get("/users/:id/ranks", async (req, res) => {
  logger.info({ req })
  const userId = req.params.id;

  try {
    const rankInfo = await getRank(userId);
    res.json(rankInfo);
  } catch (err) {
    res.status(404).json({
      error: "Not Found",
      message: "No user was found",
    });
    return;
  }
});

ranksRoute.get("/users/ranks", authMiddleware, async (req, res) => {
  logger.info({ req })
  const userId = res.locals.userId;

  try {
    const rankInfo = await getRank(userId);
    res.json(rankInfo);
  } catch (err) {
    res.status(404).json({
      error: "Not Found",
      message: "No user was found",
    });
    return;
  }
});
