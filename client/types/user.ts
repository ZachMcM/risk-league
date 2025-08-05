import { Rank } from "./rank";

export type User = {
  id: string;
  username: string;
  image: string | null;
  header: string | null;
  rank: Rank;
  nextRank: Rank | null;
  points: number
  progression: number | null;
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
