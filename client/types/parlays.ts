import { Prop } from "./props";

export type Parlay = {
  stake: number;
  type: "flex" | "perfect";
  id: number;
  createdAt: string;
  resolved: boolean;
  matchUserId: number;
  delta: number;
  parlayPicks: ParlayPick[];
};

export type ParlayPick = {
  id: number;
  status: "not_resolved" | "hit" | "missed";
  createdAt: string;
  pick: "over" | "under";
  parlayId: number;
  propId: number;
  prop: Prop;
};
