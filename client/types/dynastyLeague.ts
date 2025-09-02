import { League } from "~/lib/config";
import { User } from "./user";

export type DynastyLeague = {
  id: number;
  createdAt: string;
  startDate: string;
  endDate: string;
  league: League;
  startingBalance: number;
  title: string;
  tags: string[];
  inviteOnly: boolean;
  userCount: number;
  dynastyLeagueUsers: { userId: string }[];
  minTotalStaked: number,
  minParlays: number
};

export type DynastyLeagueUser = {
  id: number;
  rank: number | null;
  createdAt: string;
  balance: number;
  userId: string;
  dynastyLeagueId: number;
  startingBalance: number;
  role: "manager" | "member" | "owner";
  user: Omit<User, "rank" | "points">;
  totalStaked: number;
  parlaysWon: number;
  parlaysLost: number;
  parlaysInProgress: number;
  payoutPotential: number;
  totalParlays: number;
};
