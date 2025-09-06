import { Rank } from "./rank";

export type User = {
  id: string;
  image?: string;
  banner?: string;
  username: string;
  points?: number;
  rank: Rank;
};

export type Cosmetic = {
  id: number,
  type: "image" | "banner"
  title: string
  url: string
}

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
      image: string | null
    };
    count: number;
  } | null;
  mostBetTeam: {
    team: {
      fullName: String;
      image: string | null
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
