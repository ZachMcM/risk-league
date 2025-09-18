import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  and,
  eq
} from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { leagueType, player } from "../db/schema";
import { apiKeyMiddleware, upload } from "../middleware";
import { r2 } from "../r2";
import { handleError } from "../utils/handleError";

export const playersRoute = Router();

playersRoute.get(
  "/players/league/:league/active",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const league = req.params.league as
        | (typeof leagueType.enumValues)[number]
        | undefined;

      if (league === undefined || !leagueType.enumValues.includes(league)) {
        res.status(400).json({ error: "Invalid league parameter" });
        return;
      }

      const playersResult = await db.query.player.findMany({
        where: and(eq(player.league, league), eq(player.status, "ACT")),
      });

      res.json(playersResult);
    } catch (error) {
      handleError(error, res, "Players");
    }
  }
);

playersRoute.put(
  "/players/:id/league/:league/image",
  apiKeyMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);

      if (isNaN(playerId)) {
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

      const fileName = `players/${league}/${playerId}${file.originalname.substring(
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
        .update(player)
        .set({
          image: r2ImageUrl,
        })
        .where(and(eq(player.league, league), eq(player.playerId, playerId)));

      res.json({ success: true });
    } catch (error) {
      handleError(error, res, "Players");
    }
  }
);
