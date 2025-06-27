export type MatchStatus = "draw" | "in_progress" | "loss" | "win";

export type MatchListEntity = {
  id: string;
  balance: number;
  status: MatchStatus;
  createdAt: Date;
  eloDelta: number;
  opponentUsername: string;
  opponentId: string;
  opponentImage: string | null;
  opponentBalance: number;
};

export type UserStats = {
  image: string | null;
  username: string;
  balance: number;
  user_id: string | null;
  matchId: string | null;
  parlaysWon: string | number | bigint;
  parlaysLost: string | number | bigint;
  parlaysInProgress: string | number | bigint;
};

export type MatchStats = {
  userStats: UserStats,
  opponentStats: UserStats
}

export type CurrentStatus = "winning" | "losing" | "tied"