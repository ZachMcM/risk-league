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
  // Bronze Tier - Starting ranks, wider bands for new players
  { tier: "Bronze", level: "I", minPoints: 1000, maxPoints: 1099 },
  { tier: "Bronze", level: "II", minPoints: 1100, maxPoints: 1199 },
  { tier: "Bronze", level: "III", minPoints: 1200, maxPoints: 1299 },
  
  // Silver Tier - Still learning, 100 point bands
  { tier: "Silver", level: "I", minPoints: 1300, maxPoints: 1399 },
  { tier: "Silver", level: "II", minPoints: 1400, maxPoints: 1499 },
  { tier: "Silver", level: "III", minPoints: 1500, maxPoints: 1599 },
  
  // Gold Tier - Competent players, 100 point bands
  { tier: "Gold", level: "I", minPoints: 1600, maxPoints: 1699 },
  { tier: "Gold", level: "II", minPoints: 1700, maxPoints: 1799 },
  { tier: "Gold", level: "III", minPoints: 1800, maxPoints: 1899 },
  
  // Platinum Tier - Skilled players, 150 point bands
  { tier: "Platinum", level: "I", minPoints: 1900, maxPoints: 2049 },
  { tier: "Platinum", level: "II", minPoints: 2050, maxPoints: 2199 },
  { tier: "Platinum", level: "III", minPoints: 2200, maxPoints: 2349 },
  
  // Diamond Tier - Advanced players, 200 point bands
  { tier: "Diamond", level: "I", minPoints: 2350, maxPoints: 2549 },
  { tier: "Diamond", level: "II", minPoints: 2550, maxPoints: 2749 },
  { tier: "Diamond", level: "III", minPoints: 2750, maxPoints: 2949 },
  
  // Master Tier - Expert players, 250 point bands
  { tier: "Master", level: "I", minPoints: 2950, maxPoints: 3199 },
  { tier: "Master", level: "II", minPoints: 3200, maxPoints: 3449 },
  { tier: "Master", level: "III", minPoints: 3450, maxPoints: 3699 },
  
  // Elite Tier - Top players, 300 point bands
  { tier: "Elite", level: "I", minPoints: 3700, maxPoints: 3999 },
  { tier: "Elite", level: "II", minPoints: 4000, maxPoints: 4299 },
  { tier: "Elite", level: "III", minPoints: 4300, maxPoints: 4599 },
  
  // Legend Tier - The best of the best
  { tier: "Legend", level: null, minPoints: 4600, maxPoints: Infinity },
];
