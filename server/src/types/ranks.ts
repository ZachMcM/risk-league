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
  { tier: "Rookie", level: "III", minPoints: 1000, maxPoints: 1049 },
  { tier: "Rookie", level: "II", minPoints: 1050, maxPoints: 1099 },
  { tier: "Rookie", level: "I", minPoints: 1100, maxPoints: 1149 },

  { tier: "Pro", level: "III", minPoints: 1150, maxPoints: 1199 },
  { tier: "Pro", level: "II", minPoints: 1200, maxPoints: 1249 },
  { tier: "Pro", level: "I", minPoints: 1250, maxPoints: 1299 },

  { tier: "All-Star", level: "III", minPoints: 1300, maxPoints: 1349 },
  { tier: "All-Star", level: "II", minPoints: 1350, maxPoints: 1399 },
  { tier: "All-Star", level: "I", minPoints: 1400, maxPoints: 1499 },

  { tier: "Superstar", level: "III", minPoints: 1500, maxPoints: 1599 },
  { tier: "Superstar", level: "II", minPoints: 1600, maxPoints: 1699 },
  { tier: "Superstar", level: "I", minPoints: 1700, maxPoints: 1799 },

  { tier: "Elite", level: "III", minPoints: 1800, maxPoints: 1899 },
  { tier: "Elite", level: "II", minPoints: 1900, maxPoints: 1999 },
  { tier: "Elite", level: "I", minPoints: 2000, maxPoints: 2099 },

  { tier: "Legend", level: null, minPoints: 2100, maxPoints: Infinity },
];