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
