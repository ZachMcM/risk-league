
export type UserBattlePassProgress = {
  currentXp: number | null,
  battlePass: BattlePass
}

export type BattlePass = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  tiers: BattlePassTier[]
};

export type BattlePassTier = {
  id: number
  cosmeticId: number;
  tier: number;
  xpRequired: number;
  cosmetic: Cosmetic
};

export type Cosmetic = {
  id: number;
  type: "image" | "banner";
  title: string;
  url: string;
};
