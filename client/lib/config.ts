export const MIN_PCT_TOTAL_STAKED = 0.6;
export const MIN_PARLAYS_REQUIRED = 2;
export const MIN_STARTING_BALANCE = 200;
export const MAX_STARTING_BALANCE = 400;
export const MIN_STAKE_PCT = 0.2;

export const LEAGUES = ["MLB", "NBA", "NFL", "NCAAFB", "NCAABB"] as const;
export type League = (typeof LEAGUES)[number];

export const propStats = [
  {
    id: "home_runs",
    name: "Home Runs",
    league: "MLB",
  },
  {
    id: "doubles",
    name: "Doubles",
    league: "MLB",
  },
  {
    id: "hits",
    name: "Hits",
    league: "MLB",
  },
  {
    id: "triples",
    name: "Triples",
    league: "MLB",
  },
  {
    id: "rbi",
    name: "RBIs",
    league: "MLB",
  },
  {
    id: "strikeouts",
    name: "Strikeouts",
    league: "MLB",
  },
  {
    id: "pitching_strikeouts",
    name: "Pitching Strikeouts",
    league: "MLB",
  },
  {
    id: "pitches_thrown",
    name: "Pitches Thrown",
    league: "MLB",
  },
  {
    id: "earned_runs",
    name: "Earned Runs",
    league: "MLB",
  },
  {
    id: "pitching_hits",
    name: "Pitching Hits",
    league: "MLB",
  },
  {
    id: "pitching_walks",
    name: "Pitching Walks",
    league: "MLB",
  },
  {
    id: "points",
    name: "Points",
    league: "NBA",
  },
  {
    id: "rebounds",
    name: "Rebounds",
    league: "NBA",
  },
  {
    id: "assists",
    name: "Assists",
    league: "NBA",
  },
  {
    id: "three_pm",
    name: "Three Pointers Made",
    league: "NBA",
  },
  {
    id: "blocks",
    name: "Blocks",
    league: "NBA",
  },
  {
    id: "steals",
    name: "Steals",
    league: "NBA",
  },
  {
    id: "turnovers",
    name: "Turnovers",
    league: "NBA",
  },
  {
    id: "points_rebounds_assists",
    name: "Points + Rebounds + Assists",
    league: "NBA",
  },
  {
    id: "rebounds_assists",
    name: "Rebounds + Assists",
    league: "NBA",
  },
  {
    id: "points_assists",
    name: "Points + Assists",
    league: "NBA",
  },
];


