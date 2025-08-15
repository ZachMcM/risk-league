import { Router } from "express";
import { leagueType, team } from "../db/schema";
import { InferInsertModel } from "drizzle-orm";
import { apiKeyMiddleware } from "../middleware";
import { logger } from "../logger";
import { db } from "../db";
import { handleError } from "../utils/handleError";

export const teamsRoute = Router();

function validateTeamData(
  teamData: any
): teamData is InferInsertModel<typeof team> {
  const validLeagues = leagueType.enumValues;
  return (
    (typeof teamData.teamId === "number" &&
      typeof teamData.league === "string" &&
      validLeagues.includes(teamData.league as any) &&
      typeof teamData.fullName === "string" &&
      typeof teamData.abbreviation === "string") ||
    ((teamData.abbreviation === null || typeof teamData.abbreviation === "string") &&
      (teamData.location === null || typeof teamData.location === "string") &&
      (teamData.mascot === null || typeof teamData.arena === "string") &&
      teamData.arena === null)
  );
}

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

    const invalidTeams = teamsToInsert.filter((teamData, index) => {
      if (!validateTeamData(teamData)) {
        logger.warn(`Invalid team data at index ${index}`, { teamData });
        return true;
      }
      return false;
    });

    if (invalidTeams.length > 0) {
      res.status(400).json({
        error: "Invalid team data provided",
        details: `${invalidTeams.length} teams(s) have invalid data.`,
      });
      return;
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
