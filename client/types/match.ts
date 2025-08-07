import { Rank } from "./rank";
import { User } from "./user";

export type MatchStatus =
  | "disqualified"
  | "draw"
  | "loss"
  | "not_resolved"
  | "win";

export type MatchUser = {
  totalStaked: number;
  parlaysWon: number;
  parlaysLost: number;
  parlaysInProgress: number;
  payoutPotential: number;
  totalParlays: number;
  id: number;
  createdAt: string;
  balance: number;
  pointsDelta: number;
  progressionDelta: number | null;
  status: "not_resolved" | "loss" | "win" | "draw" | "disqualified";
  userId: string;
  matchId: number;
  startingBalance: number;
  user: {
    id: string;
    username: string;
    image: string;
  };
  rankSnapshot: Rank;
};

export type Match = {
  id: number;
  createdAt: string;
  resolved: boolean;
  league: string;
  matchUsers: MatchUser[];
  type: string;
};

export type CurrentStatus = "winning" | "losing" | "tied";

export type Message = {
  id: number;
  createdAt: string;
  userId: string;
  matchId: number;
  content: string;
  user: {
    id: string;
    username: string;
    image: string;
  };
};

export type FriendlyMatchRequest = {
  id: number;
  createdAt: string;
  updatedAt: string;
  incomingId: string;
  outgoingId: string;
  friend: User;
  status: "pending" | "declined" | "accepted";
};
