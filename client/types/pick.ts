import { Prop } from "./prop";

export type Pick = {
  id: number;
  status: "not_resolved" | "hit" | "missed" | "tie" | "did_not_play";
  createdAt: string;
  choice: "over" | "under";
  parlayId: number;
  propId: number;
  prop: Prop;
};