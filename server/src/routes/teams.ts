import { Router } from "express";
import { leagueType, team } from "../db/schema";
import { and, eq, InferInsertModel, sql } from "drizzle-orm";
import { apiKeyMiddleware, upload } from "../middleware";
import { logger } from "../logger";
import { db } from "../db";
import { handleError } from "../utils/handleError";
import { createInsertSchema } from "drizzle-zod";
import { r2 } from "../r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const teamsRoute = Router();
const teamsSchema = createInsertSchema(team);

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
      teamsSchema.parse(entry);
    }

    const result = await db
      .insert(team)
      .values(teamsToInsert)
      .onConflictDoUpdate({
        target: [team.teamId, team.league],
        set: {
          conference: sql`EXCLUDED.conference`,
          abbreviation: sql`EXCLUDED.abbreviation`,
          location: sql`EXCLUDED.location`,
          mascot: sql`EXCLUDED.mascot`,
          arena: sql`EXCLUDED.arena`,
        },
      })
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

teamsRoute.get("/teams/league/:league", apiKeyMiddleware, async (req, res) => {
  try {
    const league = req.params.league as
      | (typeof leagueType.enumValues)[number]
      | undefined;

    if (!league || !leagueType.enumValues.includes(league)) {
      res.status(400).json({ error: "Invalid league parameter" });
      return;
    }

    const teamsResult = await db.query.team.findMany({
      where: eq(team.league, league),
    });

    res.json(teamsResult);
  } catch (error) {
    handleError(error, res, "Teams");
  }
});

teamsRoute.get(
  "/teams/:teamId/league/:league",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const league = req.params.league as
        | (typeof leagueType.enumValues)[number]
        | undefined;

      if (league === undefined || !leagueType.enumValues.includes(league)) {
        res.status(400).json({ error: "Invalid league parameter" });
        return;
      }

      if (isNaN(teamId)) {
        res.status(400).json({ error: "Invalid teamId parameter" });
        return;
      }

      const teamResult = await db.query.team.findFirst({
        where: and(eq(team.teamId, teamId), eq(team.league, league)),
      });

      res.json(teamResult);
    } catch (error) {
      handleError(error, res, "Teams");
    }
  }
);

teamsRoute.put(
  "/teams/:id/league/:league/colors",
  apiKeyMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);

      if (isNaN(teamId)) {
        res.status(400).json({ error: "Invalid player id" });
        return;
      }

      const league = req.params.league as
        | (typeof leagueType.enumValues)[number]
        | undefined;

      if (league === undefined || !leagueType.enumValues.includes(league)) {
        res.status(400).json({ error: "Invalid league parameter" });
        return;
      }

      const { color, alternateColor } = req.body as {
        color: string | undefined;
        alternateColor: string | undefined;
      };

      if (!color || !alternateColor) {
        res.status(400).json({
          error: "Invalid request body need color and alternateColor",
        });
        return;
      }

      await db
        .update(team)
        .set({
          color,
          alternateColor,
        })
        .where(and(eq(team.league, league), eq(team.teamId, teamId)));

      res.json({ success: true });
    } catch (error) {
      handleError(error, res, "Players");
    }
  }
);

teamsRoute.put(
  "/teams/:id/league/:league/image",
  apiKeyMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);

      if (isNaN(teamId)) {
        res.status(400).json({ error: "Invalid player id" });
        return;
      }

      const league = req.params.league as
        | (typeof leagueType.enumValues)[number]
        | undefined;

      if (league === undefined || !leagueType.enumValues.includes(league)) {
        res.status(400).json({ error: "Invalid league parameter" });
        return;
      }

      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      const fileName = `teams/${league}/${teamId}${file.originalname.substring(
        file.originalname.lastIndexOf(".")
      )}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      const r2ImageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

      await db
        .update(team)
        .set({
          image: r2ImageUrl,
        })
        .where(and(eq(team.league, league), eq(team.teamId, teamId)));

      res.json({ success: true });
    } catch (error) {
      handleError(error, res, "Players");
    }
  }
);
