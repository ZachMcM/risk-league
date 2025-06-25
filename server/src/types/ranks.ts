export type Tier =
  | "Rookie"
  | "Starter"
  | "All-Star"
  | "Captain"
  | "Franchise"
  | "MVP"
  | "GOAT"
  | "Hall of Fame";

export type Level = "I" | "II" | "III";

type NonHallOfFameRank = {
  tier: Exclude<Tier, "Hall of Fame">;
  level: Level;
  minElo: number;
  maxElo: number;
};

type HallOfFameRank = {
  tier: "Hall of Fame";
  level: null;
  minElo: number;
  maxElo: number;
};

export type Rank = NonHallOfFameRank | HallOfFameRank;

export const ranks: Rank[] = [
  { tier: "Rookie", level: "I", minElo: 1200, maxElo: 1233 },
  { tier: "Rookie", level: "II", minElo: 1234, maxElo: 1266 },
  { tier: "Rookie", level: "III", minElo: 1267, maxElo: 1299 },
  { tier: "Starter", level: "I", minElo: 1300, maxElo: 1333 },
  { tier: "Starter", level: "II", minElo: 1334, maxElo: 1366 },
  { tier: "Starter", level: "III", minElo: 1367, maxElo: 1399 },
  { tier: "All-Star", level: "I", minElo: 1400, maxElo: 1433 },
  { tier: "All-Star", level: "II", minElo: 1434, maxElo: 1466 },
  { tier: "All-Star", level: "III", minElo: 1467, maxElo: 1499 },
  { tier: "Captain", level: "I", minElo: 1500, maxElo: 1533 },
  { tier: "Captain", level: "II", minElo: 1534, maxElo: 1566 },
  { tier: "Captain", level: "III", minElo: 1567, maxElo: 1599 },
  { tier: "Franchise", level: "I", minElo: 1600, maxElo: 1633 },
  { tier: "Franchise", level: "II", minElo: 1634, maxElo: 1666 },
  { tier: "Franchise", level: "III", minElo: 1667, maxElo: 1699 },
  { tier: "MVP", level: "I", minElo: 1700, maxElo: 1733 },
  { tier: "MVP", level: "II", minElo: 1734, maxElo: 1766 },
  { tier: "MVP", level: "III", minElo: 1767, maxElo: 1799 },
  { tier: "GOAT", level: "I", minElo: 1800, maxElo: 1833 },
  { tier: "GOAT", level: "II", minElo: 1834, maxElo: 1866 },
  { tier: "GOAT", level: "III", minElo: 1867, maxElo: 1899 },
  { tier: "Hall of Fame", level: null, minElo: 1900, maxElo: Infinity },
];