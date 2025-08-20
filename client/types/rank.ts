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
