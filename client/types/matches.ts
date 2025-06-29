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
  totalParlays: string | number | bigint;
  balance: number;
  image: string | null;
  username: string;
  userId: string;
  matchId: string;
  matchUserId: string;
};

export type CurrentStatus = "winning" | "losing" | "tied";

export type MatchMessage = {
  username: string;
  content: string;
  createdAt: Date;
  userId: string;
  image: string | null;
};
