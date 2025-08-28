import { Router } from "express";
import { apiKeyOrIpAddressMiddleware } from "../middleware";
import { leagueType } from "../db/schema";
import { redis } from "../redis";
import { handleError } from "../utils/handleError";

export const webhooksRoute = Router();

webhooksRoute.post(
  "/webhook/stats/league/:league",
  apiKeyOrIpAddressMiddleware,
  async (req, res) => {
    try {
      const league = req.params.league as
        | (typeof leagueType.enumValues)[number]
        | undefined;

      if (league == undefined || !leagueType.enumValues.includes(league)) {
        res.status(400).json({ error: "Invalid league" });
        return;
      }

      redis.publish("stats_updated", JSON.stringify({ league }));
    } catch (error) {
      handleError(error, res, "Webhooks");
    }
  }
);
