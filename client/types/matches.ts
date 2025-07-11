import { User } from "./user";

export type MatchStatus =
  | "disqualified"
  | "draw"
  | "loss"
  | "not_resolved"
  | "win";

export type MatchUser = {
  id: number;
  createdAt: string | null;
  balance: number;
  eloDelta: number;
  status: "not_resolved" | "loss" | "win" | "draw" | "disqualified";
  userId: number | null;
  matchId: number | null;
  user: User;
};

export type Match = {
  id: number;
  createdAt: string | null;
  resolved: boolean;
  matchUsers: MatchUser[];
};

export type CurrentStatus = "winning" | "losing" | "tied";

export type MatchMessage = {
  id: number;
  createdAt: string;
  userId: number | null;
  matchId: number | null;
  content: string;
  user: User;
};
