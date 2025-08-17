import { z } from 'zod';
import { leagueType } from '../db/schema';

// League validation
const leagueSchema = z.enum(leagueType.enumValues);

// Base schema for all stats
const baseStatsSchema = z.object({
  gameId: z.string(),
  teamId: z.number().int().positive(),
  league: leagueSchema,
});

// Football Player Stats Schema
export const footballPlayerStatsSchema = baseStatsSchema.extend({
  playerId: z.number().int().positive(),
  completions: z.number().int().min(0).optional(),
  fumblesLost: z.number().int().min(0).optional(),
  rushingLong: z.number().min(0).optional(),
  receivingLong: z.number().min(0).optional(),
  passerRating: z.number().min(0).optional(),
  passingYards: z.number().min(0).optional(),
  rushingYards: z.number().min(0).optional(),
  receivingYards: z.number().min(0).optional(),
  passingAttempts: z.number().int().min(0).optional(),
  rushingAttempts: z.number().int().min(0).optional(),
  fumbleRecoveries: z.number().int().min(0).optional(),
  passingTouchdowns: z.number().int().min(0).optional(),
  rushingTouchdowns: z.number().int().min(0).optional(),
  receivingTouchdowns: z.number().int().min(0).optional(),
  passingInterceptions: z.number().int().min(0).optional(),
  receptions: z.number().int().min(0).optional(),
  fieldGoalsAttempted: z.number().int().min(0).optional(),
  fieldGoalsMade: z.number().int().min(0).optional(),
  fieldGoalsLong: z.number().min(0).optional(),
  extraPointsAttempted: z.number().int().min(0).optional(),
  extraPointsMade: z.number().int().min(0).optional(),
  status: z.string(),
});

// Football Team Stats Schema
export const footballTeamStatsSchema = baseStatsSchema.extend({
  score: z.number().int().min(0).optional(),
  sacks: z.number().min(0).optional(),
  safeties: z.number().int().min(0).optional(),
  penaltiesTotal: z.number().int().min(0).optional(),
  penaltiesYards: z.number().int().min(0).optional(),
  turnovers: z.number().int().min(0).optional(),
  firstDowns: z.number().int().min(0).optional(),
  totalYards: z.number().int().min(0).optional(),
  blockedKicks: z.number().int().min(0).optional(),
  blockedPunts: z.number().int().min(0).optional(),
  kicksBlocked: z.number().int().min(0).optional(),
  passingYards: z.number().int().min(0).optional(),
  puntsBlocked: z.number().int().min(0).optional(),
  rushingYards: z.number().int().min(0).optional(),
  defenseTouchdowns: z.number().int().min(0).optional(),
  defenseInterceptions: z.number().int().min(0).optional(),
  kickReturnTouchdowns: z.number().int().min(0).optional(),
  puntReturnTouchdowns: z.number().int().min(0).optional(),
  blockedKickTouchdowns: z.number().int().min(0).optional(),
  blockedPuntTouchdowns: z.number().int().min(0).optional(),
  interceptionTouchdowns: z.number().int().min(0).optional(),
  fumbleReturnTouchdowns: z.number().int().min(0).optional(),
  defenseFumbleRecoveries: z.number().int().min(0).optional(),
  fieldGoalReturnTouchdowns: z.number().int().min(0).optional(),
  twoPointConversionReturns: z.number().int().min(0).optional(),
  twoPointConversionAttempts: z.number().int().min(0).optional(),
  twoPointConversionSucceeded: z.number().int().min(0).optional(),
  pointsAgainstDefenseSpecialTeams: z.number().int().min(0).optional(),
  passingTouchdowns: z.number().int().min(0).optional(),
  rushingTouchdowns: z.number().int().min(0).optional(),
  specialTeamsTouchdowns: z.number().int().min(0).optional(),
  passingYardsAllowed: z.number().int().min(0).optional(),
  rushingYardsAllowed: z.number().int().min(0).optional(),
  offenseTouchdowns: z.number().int().min(0).optional(),
});

// Basketball Player Stats Schema
export const basketballPlayerStatsSchema = baseStatsSchema.extend({
  playerId: z.number().int().positive(),
  fouls: z.number().int().min(0).optional(),
  blocks: z.number().int().min(0).optional(),
  points: z.number().int().min(0).optional(),
  steals: z.number().int().min(0).optional(),
  assists: z.number().int().min(0).optional(),
  minutes: z.number().min(0).optional(),
  turnovers: z.number().int().min(0).optional(),
  rebounds: z.number().int().min(0).optional(),
  twoPointsMade: z.number().int().min(0).optional(),
  fieldGoalsMade: z.number().int().min(0).optional(),
  freeThrowsMade: z.number().int().min(0).optional(),
  threePointsMade: z.number().int().min(0).optional(),
  defensiveRebounds: z.number().int().min(0).optional(),
  offensiveRebounds: z.number().int().min(0).optional(),
  twoPointPercentage: z.number().min(0).max(1).optional(),
  twoPointsAttempted: z.number().int().min(0).optional(),
  fieldGoalsAttempted: z.number().int().min(0).optional(),
  freeThrowsAttempted: z.number().int().min(0).optional(),
  threePointsAttempted: z.number().int().min(0).optional(),
  status: z.string(),
});

// Basketball Team Stats Schema
export const basketballTeamStatsSchema = baseStatsSchema.extend({
  score: z.number().int().min(0).optional(),
  fouls: z.number().int().min(0).optional(),
  blocks: z.number().int().min(0).optional(),
  steals: z.number().int().min(0).optional(),
  assists: z.number().int().min(0).optional(),
  turnovers: z.number().int().min(0).optional(),
  rebounds: z.number().int().min(0).optional(),
  twoPointsMade: z.number().int().min(0).optional(),
  fieldGoalsMade: z.number().int().min(0).optional(),
  freeThrowsMade: z.number().int().min(0).optional(),
  threePointsMade: z.number().int().min(0).optional(),
  defensiveRebounds: z.number().int().min(0).optional(),
  offensiveRebounds: z.number().int().min(0).optional(),
  twoPointPercentage: z.number().min(0).max(1).optional(),
  twoPointsAttempted: z.number().int().min(0).optional(),
  fieldGoalsAttempted: z.number().int().min(0).optional(),
  freeThrowsAttempted: z.number().int().min(0).optional(),
  threePointsAttempted: z.number().int().min(0).optional(),
});

// Baseball Player Stats Schema
export const baseballPlayerStatsSchema = baseStatsSchema.extend({
  playerId: z.number().int().positive(),
  errors: z.number().int().min(0).optional(),
  hits: z.number().int().min(0).optional(),
  runs: z.number().int().min(0).optional(),
  singles: z.number().int().min(0).optional(),
  doubles: z.number().int().min(0).optional(),
  triples: z.number().int().min(0).optional(),
  atBats: z.number().int().min(0).optional(),
  walks: z.number().int().min(0).optional(),
  caughtStealing: z.number().int().min(0).optional(),
  homeRuns: z.number().int().min(0).optional(),
  putouts: z.number().int().min(0).optional(),
  stolenBases: z.number().int().min(0).optional(),
  strikeouts: z.number().int().min(0).optional(),
  hitByPitch: z.number().int().min(0).optional(),
  intentionalWalks: z.number().int().min(0).optional(),
  rbis: z.number().int().min(0).optional(),
  outs: z.number().int().min(0).optional(),
  hitsAllowed: z.number().int().min(0).optional(),
  pitchingStrikeouts: z.number().int().min(0).optional(),
  losses: z.number().int().min(0).optional(),
  earnedRuns: z.number().int().min(0).optional(),
  saves: z.number().int().min(0).optional(),
  runsAllowed: z.number().int().min(0).optional(),
  wins: z.number().int().min(0).optional(),
  singlesAllowed: z.number().int().min(0).optional(),
  doublesAllowed: z.number().int().min(0).optional(),
  triplesAllowed: z.number().int().min(0).optional(),
  pitchingWalks: z.number().int().min(0).optional(),
  balks: z.number().int().min(0).optional(),
  blownSaves: z.number().int().min(0).optional(),
  pitchingCaughtStealing: z.number().int().min(0).optional(),
  homeRunsAllowed: z.number().int().min(0).optional(),
  inningsPitched: z.number().min(0).optional(),
  pitchingPutouts: z.number().int().min(0).optional(),
  stolenBasesAllowed: z.number().int().min(0).optional(),
  wildPitches: z.number().int().min(0).optional(),
  pitchingHitByPitch: z.number().int().min(0).optional(),
  holds: z.number().int().min(0).optional(),
  pitchingIntentionalWalks: z.number().int().min(0).optional(),
  pitchesThrown: z.number().int().min(0).optional(),
  strikes: z.number().int().min(0).optional(),
  status: z.string(),
});

// Baseball Team Stats Schema
export const baseballTeamStatsSchema = baseStatsSchema.extend({
  errors: z.number().int().min(0).optional(),
  hits: z.number().int().min(0).optional(),
  runs: z.number().int().min(0).optional(),
  doubles: z.number().int().min(0).optional(),
  triples: z.number().int().min(0).optional(),
  atBats: z.number().int().min(0).optional(),
  walks: z.number().int().min(0).optional(),
  caughtStealing: z.number().int().min(0).optional(),
  homeRuns: z.number().int().min(0).optional(),
  stolenBases: z.number().int().min(0).optional(),
  strikeouts: z.number().int().min(0).optional(),
  rbis: z.number().int().min(0).optional(),
});

// Array schemas for batch operations
export const footballPlayerStatsBatchSchema = z.array(footballPlayerStatsSchema);
export const footballTeamStatsBatchSchema = z.array(footballTeamStatsSchema);
export const basketballPlayerStatsBatchSchema = z.array(basketballPlayerStatsSchema);
export const basketballTeamStatsBatchSchema = z.array(basketballTeamStatsSchema);
export const baseballPlayerStatsBatchSchema = z.array(baseballPlayerStatsSchema);
export const baseballTeamStatsBatchSchema = z.array(baseballTeamStatsSchema);

// Type exports for use in routes
export type FootballPlayerStats = z.infer<typeof footballPlayerStatsSchema>;
export type FootballTeamStats = z.infer<typeof footballTeamStatsSchema>;
export type BasketballPlayerStats = z.infer<typeof basketballPlayerStatsSchema>;
export type BasketballTeamStats = z.infer<typeof basketballTeamStatsSchema>;
export type BaseballPlayerStats = z.infer<typeof baseballPlayerStatsSchema>;
export type BaseballTeamStats = z.infer<typeof baseballTeamStatsSchema>;