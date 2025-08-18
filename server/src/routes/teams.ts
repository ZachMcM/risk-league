import { Router } from "express";
import { leagueType, team } from "../db/schema";
import { InferInsertModel } from "drizzle-orm";
import { apiKeyMiddleware } from "../middleware";
import { logger } from "../logger";
import { db } from "../db";
import { handleError } from "../utils/handleError";
import { createInsertSchema } from "drizzle-zod";

export const teamsRoute = Router();
const teamsSchema = createInsertSchema(team)

teamsRoute.post("/teams", apiKeyMiddleware, async (req, res) => {
  try {
    const isBatch = Array.isArray(req.body.teams);
    const teamsToInsert: InferInsertModel<typeof team>[] = isBatch
      ? req.body.teams
      : [req.body];

    if (teamsToInsert.length === 0) {
      res.status(400).json({ error: "No teams provided" });
      return;
    }

    for (const entry of teamsToInsert) {
      teamsSchema.parse(entry)
    } 

    const result = await db
      .insert(team)
      .values(teamsToInsert)
      .returning({ id: team.teamId });

    logger.info(`Successfully inserted ${result.length} teams(s)`);

    res.json(isBatch ? result : result[0]);
  } catch (error) {
    logger.error("Error inserting teams:", error);

    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        res.status(409).json({ error: "One or more teams already exist" });
        return;
      }
      if (error.message.includes("foreign key")) {
        res.status(400).json({ error: "Invalid team ID provided" });
        return;
      }
    }

    handleError(error, res, "Teams route");
  }
});
