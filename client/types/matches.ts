import { User } from "./user";

export type MatchStatus =
  | "disqualified"
  | "draw"
  | "loss"
  | "not_resolved"
  | "win";

export type MatchUser = {
  parlaysWon: number;
  parlaysLost: number;
  parlaysInProgress: number;
  potentialPayout: number;
  id: number;
  createdAt: string;
  balance: number;
  eloDelta: number;
  status: "not_resolved" | "loss" | "win" | "draw" | "disqualified";
  userId: number;
  matchId: number;
  startingBalance: number;
  user: User;
  eloRatingSnapshot: number;
};

export type Match = {
  id: number;
  createdAt: string;
  resolved: boolean;
  league: "nba" | "mlb";
  matchUsers: MatchUser[];
  type: string
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
