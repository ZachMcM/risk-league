import { Router } from "express";
import { apiKeyMiddleware } from "../middleware";
import { logger } from "../logger";
import { and, desc, eq, InferInsertModel, ne } from "drizzle-orm";
import {
  footballPlayerStats,
  footballTeamStats,
  game,
  leagueType,
  player,
} from "../db/schema";
import { db } from "../db";
import { handleError } from "../utils/handleError";

export const footballStatsRoute = Router();

function validateTeamStats(
  teamStats: any,
): teamStats is InferInsertModel<typeof footballTeamStats> {
  const validLeagues = leagueType.enumValues;
  return (
    typeof teamStats.gameId === "string" &&
    typeof teamStats.teamId === "number" &&
    typeof teamStats.league === "string" &&
    validLeagues.includes(teamStats.league as any) &&
    (typeof teamStats.score === "number" || teamStats.score === undefined) &&
    (typeof teamStats.sacks === "number" || teamStats.sacks === undefined) &&
    (typeof teamStats.safeties === "number" ||
      teamStats.safeties === undefined) &&
    (typeof teamStats.penaltiesTotal === "number" ||
      teamStats.penaltiesTotal === undefined) &&
    (typeof teamStats.penaltiesYards === "number" ||
      teamStats.penaltiesYards === undefined) &&
    (typeof teamStats.turnovers === "number" ||
      teamStats.turnovers === undefined) &&
    (typeof teamStats.firstDowns === "number" ||
      teamStats.firstDowns === undefined) &&
    (typeof teamStats.totalYards === "number" ||
      teamStats.totalYards === undefined) &&
    (typeof teamStats.blockedKicks === "number" ||
      teamStats.blockedKicks === undefined) &&
    (typeof teamStats.blockedPunts === "number" ||
      teamStats.blockedPunts === undefined) &&
    (typeof teamStats.kicksBlocked === "number" ||
      teamStats.kicksBlocked === undefined) &&
    (typeof teamStats.passingYards === "number" ||
      teamStats.passingYards === undefined) &&
    (typeof teamStats.puntsBlocked === "number" ||
      teamStats.puntsBlocked === undefined) &&
    (typeof teamStats.rushingYards === "number" ||
      teamStats.rushingYards === undefined) &&
    (typeof teamStats.defenseTouchdowns === "number" ||
      teamStats.defenseTouchdowns === undefined) &&
    (typeof teamStats.defenseInterceptions === "number" ||
      teamStats.defenseInterceptions === undefined) &&
    (typeof teamStats.kickReturnTouchdowns === "number" ||
      teamStats.kickReturnTouchdowns === undefined) &&
    (typeof teamStats.puntReturnTouchdowns === "number" ||
      teamStats.puntReturnTouchdowns === undefined) &&
    (typeof teamStats.blockedKickTouchdowns === "number" ||
      teamStats.blockedKickTouchdowns === undefined) &&
    (typeof teamStats.blockedPuntTouchdowns === "number" ||
      teamStats.blockedPuntTouchdowns === undefined) &&
    (typeof teamStats.interceptionTouchdowns === "number" ||
      teamStats.interceptionTouchdowns === undefined) &&
    (typeof teamStats.fumbleReturnTouchdowns === "number" ||
      teamStats.fumbleReturnTouchdowns === undefined) &&
    (typeof teamStats.defenseFumbleRecoveries === "number" ||
      teamStats.defenseFumbleRecoveries === undefined) &&
    (typeof teamStats.fieldGoalReturnTouchdowns === "number" ||
      teamStats.fieldGoalReturnTouchdowns === undefined) &&
    (typeof teamStats.twoPointConversionReturns === "number" ||
      teamStats.twoPointConversionReturns === undefined) &&
    (typeof teamStats.twoPointConversionAttempts === "number" ||
      teamStats.twoPointConversionAttempts === undefined) &&
    (typeof teamStats.twoPointConversionSucceeded === "number" ||
      teamStats.twoPointConversionSucceeded === undefined) &&
    (typeof teamStats.pointsAgainstDefenseSpecialTeams === "number" ||
      teamStats.pointsAgainstDefenseSpecialTeams === undefined) &&
    (typeof teamStats.passingTouchdowns === "number" ||
      teamStats.passingTouchdowns === undefined) &&
    (typeof teamStats.rushingTouchdowns === "number" ||
      teamStats.rushingTouchdowns === undefined) &&
    (typeof teamStats.specialTeamsTouchdowns === "number" ||
      teamStats.specialTeamsTouchdowns === undefined) &&
    (typeof teamStats.totalPassingYardsAllowed === "number" ||
      teamStats.totalPassingYardsAllowed === undefined) &&
    (typeof teamStats.totalRushingYardsAllowed === "number" ||
      teamStats.totalRushingYardsAllowed === undefined) &&
    (typeof teamStats.offenseTouchdowns === "number" ||
      teamStats.offenseTouchdowns === undefined)
  );
}

footballStatsRoute.post(
  "/football-stats/teams",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const isBatch = Array.isArray(req.body.teamStats);
      const teamStatsToInsert: InferInsertModel<typeof footballTeamStats>[] =
        isBatch ? req.body.teamStats : [req.body];

      if (teamStatsToInsert.length === 0) {
        res.status(400).json({ error: "No team stat entries provided" });
        return;
      }

      const invalidTeamStats = teamStatsToInsert.filter(
        (teamStatsData, index) => {
          if (!validateTeamStats(teamStatsData)) {
            logger.warn(`Invalid team stats data at index ${index}`, {
              teamStatsData,
            });
            return true;
          }
          return false;
        },
      );

      if (invalidTeamStats.length > 0) {
        res.status(400).json({
          error: "Invalid team stats data provided",
          details: `${invalidTeamStats.length} team stats have invalid data.`,
        });
        return;
      }

      const result = await db
        .insert(footballTeamStats)
        .values(teamStatsToInsert)
        .returning({
          teamId: footballTeamStats.teamId,
          gameId: footballTeamStats.gameId,
        });

      logger.info(`Successfully inserted ${result.length} team stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      handleError(error, res, "Football stats route");
    }
  },
);

function validatePlayerStats(
  playerStats: any,
): playerStats is InferInsertModel<typeof footballPlayerStats> {
  const validLeagues = leagueType.enumValues;
  return (
    typeof playerStats.gameId === "string" &&
    typeof playerStats.playerId === "number" &&
    typeof playerStats.league === "string" &&
    validLeagues.includes(playerStats.league as any) &&
    (typeof playerStats.completions === "number" ||
      playerStats.completions === undefined) &&
    (typeof playerStats.fumblesLost === "number" ||
      playerStats.fumblesLost === undefined) &&
    (typeof playerStats.rushingLong === "number" ||
      playerStats.rushingLong === undefined) &&
    (typeof playerStats.passerRating === "number" ||
      playerStats.passerRating === undefined) &&
    (typeof playerStats.passingYards === "number" ||
      playerStats.passingYards === undefined) &&
    (typeof playerStats.rushingYards === "number" ||
      playerStats.rushingYards === undefined) &&
    (typeof playerStats.passingAttempts === "number" ||
      playerStats.passingAttempts === undefined) &&
    (typeof playerStats.rushingAttempts === "number" ||
      playerStats.rushingAttempts === undefined) &&
    (typeof playerStats.passingTouchdowns === "number" ||
      playerStats.passingTouchdowns === undefined) &&
    (typeof playerStats.rushingTouchdowns === "number" ||
      playerStats.rushingTouchdowns === undefined) &&
    (typeof playerStats.passingInterceptions === "number" ||
      playerStats.passingInterceptions === undefined) &&
    (typeof playerStats.receivingYards === "number" ||
      playerStats.receivingYards === undefined) &&
    (typeof playerStats.receivingTouchdowns === "number" ||
      playerStats.receivingTouchdowns === undefined) &&
    (typeof playerStats.receivingLong === "number" ||
      playerStats.receivingLong === undefined) &&
    (typeof playerStats.receptions === "number" ||
      playerStats.receptions === undefined) &&
    (typeof playerStats.fieldGoalsAttempted === "number" ||
      playerStats.fieldGoalsAttempted === undefined) &&
    (typeof playerStats.fieldGoalsMade === "number" ||
      playerStats.fieldGoalsMade === undefined) &&
    (typeof playerStats.fieldGoalsLong === "number" ||
      playerStats.fieldGoalsLong === undefined) &&
    (typeof playerStats.extraPointsAttempted === "number" ||
      playerStats.extraPointsAttempted === undefined) &&
    (typeof playerStats.extraPointsMade === "number" ||
      playerStats.extraPointsMade === undefined)
  );
}

footballStatsRoute.post(
  "/football-stats/players",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const isBatch = Array.isArray(req.body.playerStats);
      const playerStatsToInsert: InferInsertModel<
        typeof footballPlayerStats
      >[] = isBatch ? req.body.playerStats : [req.body];

      if (playerStatsToInsert.length === 0) {
        res.status(400).json({ error: "No player stat entries provided" });
        return;
      }

      const invalidPlayerStats = playerStatsToInsert.filter(
        (playerStatsData, index) => {
          if (!validatePlayerStats(playerStatsData)) {
            logger.warn(`Invalid player stats data at index ${index}`, {
              playerStatsData,
            });
            return true;
          }
          return false;
        },
      );

      if (invalidPlayerStats.length > 0) {
        res.status(400).json({
          error: "Invalid player stats data provided",
          details: `${invalidPlayerStats.length} player stats have invalid data.`,
        });
        return;
      }

      const result = await db
        .insert(footballPlayerStats)
        .values(playerStatsToInsert)
        .returning({ id: footballPlayerStats.id });

      logger.info(`Successfully inserted ${result.length} player stat entries`);

      res.json(isBatch ? result : result[0]);
    } catch (error) {
      handleError(error, res, "Football stats route");
    }
  },
);

footballStatsRoute.get(
  "/football-stats/:league/players/:playerId",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const limitStr = req.query.limit as string | undefined;

      if (!limitStr) {
        res.status(400).json({ error: "Invalid query string, missing limit" });
        return;
      }

      const playerId = parseInt(req.params.playerId);
      const limit = parseInt(limitStr);
      const league = req.params.league as
        | (typeof leagueType.enumValues)[number]
        | undefined;

      if (
        league === undefined ||
        !["NFL", "NCAAFB"].includes(league) ||
        isNaN(playerId) ||
        isNaN(limit) ||
        limit <= 0
      ) {
        res.status(400).json({ error: "Invalid playerId or limit parameter" });
        return;
      }

      const playerStats = (
        await db
          .select()
          .from(footballPlayerStats)
          .innerJoin(game, eq(footballPlayerStats.gameId, game.gameId))
          .where(
            and(
              eq(footballPlayerStats.playerId, playerId),
              eq(footballPlayerStats.league, league),
            ),
          )
          .orderBy(desc(game.startTime))
          .limit(limit)
      ).map((row) => row.football_player_stats);

      const extendedStats = playerStats.map((stats) => ({
        ...stats,
        receivingRushingTouchdowns:
          stats.rushingTouchdowns + stats.receivingTouchdowns,
        passingRushingTouchdowns:
          stats.passingTouchdowns + stats.receivingTouchdowns,
      }));

      res.json(extendedStats);
    } catch (error) {
      handleError(error, res, "Football stats");
    }
  },
);

footballStatsRoute.get(
  "/football-stats/:league/teams/:teamId",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const limitStr = req.query.limit as string | undefined;

      if (!limitStr) {
        res.status(400).json({ error: "Invalid query string, missing limit" });
        return;
      }

      const teamId = parseInt(req.params.teamId);
      const limit = parseInt(limitStr);
      const league = req.params.league as
        | (typeof leagueType.enumValues)[number]
        | undefined;

      if (
        league === undefined ||
        !["NFL", "NCAAFB"].includes(league) ||
        isNaN(teamId) ||
        isNaN(limit) ||
        limit <= 0
      ) {
        res.status(400).json({ error: "Invalid teamId or limit parameter" });
        return;
      }

      const teamStats = (
        await db
          .select()
          .from(footballTeamStats)
          .innerJoin(game, eq(footballTeamStats.gameId, game.gameId))
          .where(
            and(
              eq(footballTeamStats.teamId, teamId),
              eq(footballTeamStats.league, league),
            ),
          )
          .orderBy(desc(game.startTime))
          .limit(limit)
      ).map((row) => row.football_team_stats);

      const extendedStats = Promise.all(
        teamStats.map(async (stats) => {
          const oppStats = (await db.query.footballTeamStats.findFirst({
            where: and(
              eq(footballTeamStats.gameId, stats.gameId),
              ne(footballTeamStats.teamId, stats.teamId),
              eq(footballTeamStats.league, league),
            ),
          }))!;

          const allOpponentStats = (
            await db
              .select()
              .from(footballPlayerStats)
              .innerJoin(
                player,
                and(
                  eq(footballPlayerStats.playerId, player.playerId),
                  eq(footballPlayerStats.league, player.league),
                ),
              )
              .where(
                and(
                  eq(footballPlayerStats.gameId, stats.gameId),
                  eq(footballPlayerStats.league, league),
                  ne(player.teamId, stats.teamId),
                ),
              )
          ).map((row) => row.football_player_stats);

          const passingYardsAllowed =
            stats.passingYardsAllowed ?? oppStats.passingYards;

          const completionsAllowed = allOpponentStats.reduce(
            (accum, curr) => accum + curr.completions,
            0,
          );

          const rushingYardsAllowed =
            stats.rushingYardsAllowed ?? oppStats.rushingYards;

          const passingTouchdownsAllowed = oppStats.passingTouchdowns;

          const rushingTouchdownsAllowed = oppStats.rushingTouchdowns;

          return {
            ...stats,
            passingYardsAllowed,
            completionsAllowed,
            rushingYardsAllowed,
            passingTouchdownsAllowed,
            rushingTouchdownsAllowed,
          };
        }),
      );

      res.json(extendedStats);
    } catch (error) {
      handleError(error, res, "Football stats");
    }
  },
);
