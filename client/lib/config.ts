import { Rank } from "~/types/rank";

export const MIN_PCT_TOTAL_STAKED = 0.5;
export const MIN_PARLAYS_REQUIRED = 2;
export const MIN_STARTING_BALANCE = 200;
export const MAX_STARTING_BALANCE = 400;
export const MIN_STAKE_PCT = 0.2;

export const LEAGUES = ["MLB", "NBA", "NFL", "NCAAFB", "NCAABB"] as const;
export type League = (typeof LEAGUES)[number];

export const BATTLE_PASS_ID = 1
export const BATTLE_PASS_NAME = "Season Zero"

export const ranksList: Omit<Rank, "minPoints" | "maxPoints">[] = [
  {
    tier: "Rookie",
    level: "I"
  },
  {
    tier: "Rookie",
    level: "II"
  },
  {
    tier: "Rookie",
    level: "III"
  },
  {
    tier: "Pro",
    level: "I"
  },
  {
    tier: "Pro",
    level: "II"
  },
  {
    tier: "Pro",
    level: "III"
  },
  {
    tier: "All-Star",
    level: "I"
  },
  {
    tier: "All-Star",
    level: "II"
  },
  {
    tier: "All-Star",
    level: "III"
  },
  {
    tier: "Elite",
    level: "I"
  },
  {
    tier: "Elite",
    level: "II"
  },
  {
    tier: "Elite",
    level: "III"
  },
  {
    tier: "Superstar",
    level: "I"
  },
  {
    tier: "Superstar",
    level: "II"
  },
  {
    tier: "Superstar",
    level: "III"
  },
  {
    tier: "Legend",
    level: null
  }
]

export const propStats = [
  {
    displayName: "Home Runs",
    leagues: ["MLB"],
  },
  {
    displayName: "Doubles",
    leagues: ["MLB"],
  },
  {
    displayName: "Hits",
    leagues: ["MLB"],
  },
  {
    displayName: "Triples",
    leagues: ["MLB"],
  },
  {
    displayName: "RBIs",
    leagues: ["MLB"],
  },
  {
    displayName: "Batting Strikeouts",
    leagues: ["MLB"],
  },
  {
    displayName: "Pitching Strikeouts",
    leagues: ["MLB"],
  },
  {
    displayName: "Pitches Thrown",
    leagues: ["MLB"],
  },
  {
    displayName: "Earned Runs",
    leagues: ["MLB"],
  },
  {
    displayName: "Hits Allowed",
    leagues: ["MLB"],
  },
  {
    displayName: "Pitching Walks",
    leagues: ["MLB"],
  },
  {
    displayName: "Runs",
    leagues: ["MLB"],
  },
  {
    displayName: "Hits+Runs+RBIs",
    leagues: ["MLB"],
  },
  {
    displayName: "Stolen Bases",
    leagues: ["MLB"],
  },
  {
    displayName: "Points",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "Rebounds",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "Assists",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "3-PT Made",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "3-PT Attempted",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "Blocks",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "Steals",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "Turnovers",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "Pts+Rebs+Asts",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "Pts+Rebs",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "Pts+Asts",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "Rebs+Asts",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "FT Made",
    leagues: ["NBA", "NCAABB"],
  },
  {
    displayName: "Passing Yards",
    leagues: ["NFL", "NCAAFB"],
  },
  {
    displayName: "Receiving Yards",
    leagues: ["NFL", "NCAAFB"],
  },
  {
    displayName: "Rushing Yards",
    leagues: ["NFL", "NCAAFB"],
  },
  {
    displayName: "Field Goals Made",
    leagues: ["NFL", "NCAAFB"],
  },
  {
    displayName: "Receiving Touchdowns",
    leagues: ["NFL", "NCAAFB"],
  },
  {
    displayName: "Passing Touchdowns",
    leagues: ["NFL", "NCAAFB"],
  },
  {
    displayName: "Passing Interceptions",
    leagues: ["NFL", "NCAAFB"],
  },
  {
    displayName: "Rushing Touchdowns",
    leagues: ["NFL", "NCAAFB"],
  },
  {
    displayName: "Receiving+Rushing TDs",
    leagues: ["NFL", "NCAAFB"],
  },
  {
    displayName: "Passing+Rushing TDs",
    leagues: ["NFL", "NCAAFB"],
  },
];


