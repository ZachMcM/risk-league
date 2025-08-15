import { Rank } from "./rank";

export type User = {
  id: string;
  image: string;
  username: string;
  rank: Rank;
};

export type Career = {
  currentRank: Rank;
  peakRank: Rank;
  pointsTimeline: { x: string; y: number }[];
  matchStats: {
    total: number;
    wins: number;
    draws: number;
    losses: number;
  };
  parlayStats: {
    total: number;
    wins: number;
    losses: number;
  };
  mostBetPlayer: {
    player: {
      name: string;
    };
    count: number;
  } | null;
  mostBetTeam: {
    team: {
      fullName: String;
    };
    count: number;
  } | null;
};

export type Friendship = {
  friend: User;
  status: "pending" | "accepted";
  outgoingId: string;
  incomingId: string;
  createdAt: string;
  updatedAt: string;
};
