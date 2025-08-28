import { Prop } from "./prop";

export type Parlay = {
  stake: number;
  type: "flex" | "perfect";
  id: number;
  createdAt: string;
  resolved: boolean;
  matchUserId: number | null;
  dynastyLeagueUserId: number | null
  profit: number;
  picks: Pick[];
};

export type Pick = {
  id: number;
  status: "not_resolved" | "hit" | "missed";
  createdAt: string;
  choice: "over" | "under";
  parlayId: number;
  propId: number;
  prop: Prop;
};
