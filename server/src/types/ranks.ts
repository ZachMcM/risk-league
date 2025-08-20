export type Tier =
  | "Rookie"
  | "Pro"
  | "All-Star"
  | "Elite"
  | "Superstar"
  | "Legend";

export type Level = "I" | "II" | "III";

type NonLegendRank = {
  tier: Exclude<Tier, "Legend">;
  level: Level;
  minPoints: number;
  maxPoints: number;
};

type LegendRank = {
  tier: "Legend";
  level: null;
  minPoints: number;
  maxPoints: number;
};

export type Rank = NonLegendRank | LegendRank;

export const ranks: Rank[] = [
  // Rookie Tier - Wide entry bands (200 points each)
  { tier: "Rookie", level: "III", minPoints: 1000, maxPoints: 1199 },
  { tier: "Rookie", level: "II", minPoints: 1200, maxPoints: 1399 },
  { tier: "Rookie", level: "I", minPoints: 1400, maxPoints: 1599 },

  // Pro Tier - Standard progression (200 points each)
  { tier: "Pro", level: "III", minPoints: 1600, maxPoints: 1799 },
  { tier: "Pro", level: "II", minPoints: 1800, maxPoints: 1999 },
  { tier: "Pro", level: "I", minPoints: 2000, maxPoints: 2199 },

  // All-Star Tier - Standard progression (200 points each)
  { tier: "All-Star", level: "III", minPoints: 2200, maxPoints: 2399 },
  { tier: "All-Star", level: "II", minPoints: 2400, maxPoints: 2599 },
  { tier: "All-Star", level: "I", minPoints: 2600, maxPoints: 2799 },

  // Elite Tier - Slightly wider (225 points each)
  { tier: "Elite", level: "III", minPoints: 2800, maxPoints: 3024 },
  { tier: "Elite", level: "II", minPoints: 3025, maxPoints: 3249 },
  { tier: "Elite", level: "I", minPoints: 3250, maxPoints: 3474 },

  // Superstar Tier - Wider for top players (275 points each)
  { tier: "Superstar", level: "III", minPoints: 3475, maxPoints: 3749 },
  { tier: "Superstar", level: "II", minPoints: 3750, maxPoints: 4024 },
  { tier: "Superstar", level: "I", minPoints: 4025, maxPoints: 4299 },

  // Legend Tier - The pinnacle
  { tier: "Legend", level: null, minPoints: 4300, maxPoints: Infinity },
];