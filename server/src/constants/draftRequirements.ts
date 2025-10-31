export interface PickRequirement {
  name: string;
  count: number;
  eligiblePositions: string[];
}

export const BASKETBALL_PICK_REQS: PickRequirement[] = [
  {
    name: "guard",
    count: 2,
    eligiblePositions: ["PG", "SG", "G", "GF"],
  },
  {
    name: "forward",
    count: 2,
    eligiblePositions: ["SF", "PF", "F", "FC", "GF"],
  },
  {
    name: "center",
    count: 1,
    eligiblePositions: ["C", "FC"],
  },
];

export const FOOTBALL_PICK_REQS: PickRequirement[] = [
  {
    name: "qb",
    count: 1,
    eligiblePositions: ["QB"],
  },
  {
    name: "wr",
    count: 1,
    eligiblePositions: ["WR"],
  },
  {
    name: "rb",
    count: 1,
    eligiblePositions: ["RB"],
  },
  {
    name: "te",
    count: 1,
    eligiblePositions: ["TE"],
  },
  {
    name: "flex",
    count: 1,
    eligiblePositions: ["RB", "WR", "TE"],
  },
];

export const BASEBALL_PICK_REQS: PickRequirement[] = [
  {
    name: "batter",
    count: 4,
    eligiblePositions: [
      "1B",
      "2B",
      "3B",
      "SS",
      "C",
      "CF",
      "RF",
      "LF",
      "TWP",
      "DH",
      "OF",
      "IF",
    ],
  },
  {
    name: "pitcher",
    count: 1,
    eligiblePositions: ["P"],
  },
];

export function getPickRequirements(league: string): PickRequirement[] {
  const leagueUpper = league.toUpperCase();

  if (leagueUpper === "NBA" || leagueUpper === "NCAABB") {
    return BASKETBALL_PICK_REQS;
  } else if (leagueUpper === "NFL" || leagueUpper === "NCAAFB") {
    return FOOTBALL_PICK_REQS;
  } else if (leagueUpper === "MLB") {
    return BASEBALL_PICK_REQS;
  }

  throw new Error(`Unknown league: ${league}`);
}
