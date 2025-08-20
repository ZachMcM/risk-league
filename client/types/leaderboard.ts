import { User } from "./user";

export type LeaderboardPage = {
  users: (User & { position: number; progression: number; points?: number, wins: number })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};
