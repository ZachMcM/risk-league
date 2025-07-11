export type Tier =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Master"
  | "Elite"
  | "Legend";

export type Level = "I" | "II" | "III";

type NonLegendRank = {
  tier: Exclude<Tier, "Legend">;
  level: Level;
  minElo: number;
  maxElo: number;
};

type LegendRank = {
  tier: "Legend";
  level: null;
  minElo: number;
  maxElo: number;
};

export type Rank = NonLegendRank | LegendRank;

export const ranks: Rank[] = [
  { tier: "Bronze", level: "I", minElo: 1200, maxElo: 1233 },
  { tier: "Bronze", level: "II", minElo: 1234, maxElo: 1266 },
  { tier: "Bronze", level: "III", minElo: 1267, maxElo: 1299 },
  { tier: "Silver", level: "I", minElo: 1300, maxElo: 1333 },
  { tier: "Silver", level: "II", minElo: 1334, maxElo: 1366 },
  { tier: "Silver", level: "III", minElo: 1367, maxElo: 1399 },
  { tier: "Gold", level: "I", minElo: 1400, maxElo: 1433 },
  { tier: "Gold", level: "II", minElo: 1434, maxElo: 1466 },
  { tier: "Gold", level: "III", minElo: 1467, maxElo: 1499 },
  { tier: "Platinum", level: "I", minElo: 1500, maxElo: 1533 },
  { tier: "Platinum", level: "II", minElo: 1534, maxElo: 1566 },
  { tier: "Platinum", level: "III", minElo: 1567, maxElo: 1599 },
  { tier: "Diamond", level: "I", minElo: 1600, maxElo: 1633 },
  { tier: "Diamond", level: "II", minElo: 1634, maxElo: 1666 },
  { tier: "Diamond", level: "III", minElo: 1667, maxElo: 1699 },
  { tier: "Master", level: "I", minElo: 1700, maxElo: 1733 },
  { tier: "Master", level: "II", minElo: 1734, maxElo: 1766 },
  { tier: "Master", level: "III", minElo: 1767, maxElo: 1799 },
  { tier: "Elite", level: "I", minElo: 1800, maxElo: 1833 },
  { tier: "Elite", level: "II", minElo: 1834, maxElo: 1866 },
  { tier: "Elite", level: "III", minElo: 1867, maxElo: 1899 },
  { tier: "Legend", level: null, minElo: 1900, maxElo: Infinity },
];
