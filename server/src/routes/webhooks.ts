import { Router } from "express";
import { leagueType } from "../db/schema";
import { apiKeyOrIpAddressMiddleware } from "../middleware";
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

      // TODO commented out to save costs for now
      // redis.publish("stats_updated", JSON.stringify({ league }));

      res.json({ success: true })
    } catch (error) {
      handleError(error, res, "Webhooks");
    }
  }
);
