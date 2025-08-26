import {
  and,
  eq,
  inArray,
  InferInsertModel,
  notInArray,
  sql,
} from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { leagueType, player, team } from "../db/schema";
import { logger } from "../logger";
import { apiKeyMiddleware, upload } from "../middleware";
import {
  LeagueDepthCharts,
  LeagueInjuries,
  PositionDepthChart,
} from "../types/dataFeeds";
import { dataFeedsReq } from "../utils/dataFeedsUtils";
import { handleError } from "../utils/handleError";
import { createInsertSchema } from "drizzle-zod";
import { r2 } from "../r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const playersRoute = Router();
const playersSchema = createInsertSchema(player);

playersRoute.post("/players", apiKeyMiddleware, async (req, res) => {
  try {
    const isBatch = Array.isArray(req.body.players);
    const playersToInsert: InferInsertModel<typeof player>[] = isBatch
      ? req.body.players
      : [req.body];

    if (playersToInsert.length === 0) {
      res.status(400).json({ error: "No players provided" });
      return;
    }

    for (const entry of playersToInsert) {
      playersSchema.parse(entry);
    }

    // Check which players have existing teams
    const playersWithValidTeams = [];
    let skippedCount = 0;

    for (const playerData of playersToInsert) {
      try {
        const teamExists = await db
          .select({ teamId: team.teamId })
          .from(team)
          .where(
            sql`${team.teamId} = ${playerData.teamId} AND ${team.league} = ${playerData.league}`
          )
          .limit(1);

        if (teamExists.length > 0) {
          playersWithValidTeams.push(playerData);
        } else {
          logger.warn(
            `Skipping player ${playerData.name} - team ${playerData.teamId} not found in league ${playerData.league}`
          );
          skippedCount++;
        }
      } catch (error) {
        logger.warn(
          `Error checking team for player ${playerData.name}:`,
          error
        );
        skippedCount++;
      }
    }

    if (playersWithValidTeams.length === 0) {
      res.status(304).json({
        error: "No players with valid team references",
        skipped: skippedCount,
      });
      return;
    }

    const result = await db
      .insert(player)
      .values(playersWithValidTeams)
      .onConflictDoUpdate({
        target: [player.playerId, player.league],
        set: {
          teamId: sql`EXCLUDED.team_id`,
          position: sql`EXCLUDED.position`,
          updatedAt: sql`EXCLUDED.updated_at`,
          status: sql`EXCLUDED.status`,
        },
      })
      .returning({ id: player.playerId });

    logger.info(
      `Successfully inserted ${result.length} player(s), skipped ${skippedCount} player(s) with missing team references`
    );

    res.json(isBatch ? result : result[0]);
  } catch (error) {
    handleError(error, res, "Player route");
  }
});

playersRoute.get(
  "/players/league/:league/team/:teamId/active",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const league = req.params.league as
        | undefined
        | (typeof leagueType.enumValues)[number];
      const teamId = parseInt(req.params.teamId);

      if (
        league === undefined ||
        !leagueType.enumValues.includes(league) ||
        isNaN(teamId)
      ) {
        res.status(400).json({ error: "Invalid league or teamId parameter" });
        return;
      }

      const teamResult = await db.query.team.findFirst({
        where: and(eq(team.teamId, teamId), eq(team.league, league)),
      });

      if (!teamResult) {
        res.status(400).json({ error: "Invalid teamId, no team found" });
        return;
      }

      let activePlayersList;

      // For college leagues, just return all players (no injury/depth chart data available)
      if (league === "NCAAFB" || league === "NCAABB") {
        activePlayersList = await db.query.player.findMany({
          where: and(
            eq(player.teamId, teamId),
            eq(player.league, league),
            eq(player.status, "ACT")
          ),
        });
      } else {
        // For professional leagues, use injury and depth chart filtering
        const leagueInjuries: LeagueInjuries = await dataFeedsReq(
          `/injuries/${league}`,
          {
            team_id: teamId,
          }
        );
        const teamInjuries = leagueInjuries["data"][league].find(
          (team) => team.team_id == teamId
        )!;
        const injuriesIdsList = teamInjuries.injuries.map((injuryEntry) =>
          parseInt(injuryEntry.player_id)
        );

        const leagueDepthCharts: LeagueDepthCharts = (
          await dataFeedsReq(`/depth-charts/${league}`, { team_id: teamId })
        ).data;

        const teamDepthChart =
          leagueDepthCharts[league][Object.keys(leagueDepthCharts[league])[0]];

        // Extract player IDs from the depth chart based on league-specific rules
        const depthChartPlayerIds: number[] = [];
        Object.keys(teamDepthChart).forEach((position) => {
          const positionData = teamDepthChart[position];
          if (
            typeof positionData === "object" &&
            positionData !== null &&
            "team_id" in positionData === false
          ) {
            if (league === "NFL") {
              // NFL-specific position and depth filtering
              const positionDepthChart = positionData as PositionDepthChart;
              Object.entries(positionDepthChart).forEach(([depth, player]) => {
                if (player && typeof player === "object" && "id" in player) {
                  const shouldInclude =
                    (position === "QB" && depth === "1") ||
                    (["WR1", "WR2", "WR3"].includes(position) &&
                      depth === "1") ||
                    (position == "PK" && depth == "1") ||
                    (position === "TE" && ["1", "2"].includes(depth)) ||
                    (position === "RB" && ["1", "2", "3"].includes(depth));

                  if (shouldInclude) {
                    depthChartPlayerIds.push(player.id);
                  }
                }
              });
            } else {
              // For other leagues, include all players (existing behavior)
              Object.values(positionData as PositionDepthChart).forEach(
                (player) => {
                  if (player && typeof player === "object" && "id" in player) {
                    depthChartPlayerIds.push(player.id);
                  }
                }
              );
            }
          }
        });

        activePlayersList = await db.query.player.findMany({
          where: and(
            eq(player.teamId, teamId),
            eq(player.league, league),
            notInArray(player.playerId, injuriesIdsList),
            inArray(player.playerId, depthChartPlayerIds)
          ),
        });
      }

      res.json(activePlayersList);
    } catch (error) {
      handleError(error, res, "Players");
    }
  }
);

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

      res.json(playersResult)
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
