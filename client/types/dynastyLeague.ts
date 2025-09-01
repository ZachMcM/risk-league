import { League } from "~/lib/config";
import { User } from "./user";

export type DynastyLeague = {
  id: number;
  createdAt: string;
  startDate: string;
  endDate: string;
  resolved: boolean;
  league: League;
  startingBalance: number;
  title: string;
  tags: string[];
  inviteOnly: boolean;
  userCount: number;
};

export type DynastyLeagueUser = {
  id: number;
  createdAt: string;
  balance: number;
  placement: number | null;
  userId: string;
  dynastyLeagueId: number;
  startingBalance: number;
  role: "manager" | "member";
  user: Omit<User, "rank" | "points">;
  totalStaked: number;
  parlaysWon: number;
  parlaysLost: number;
  parlaysInProgress: number;
  payoutPotential: number;
  totalParlays: number;
};

export type DynastyLeagueInvitation = {
  id: number;
  createdAt: string;
  status: "pending" | "declined" | "accepted";
  outgoingId: string;
  incomingId: string;
  dynastyLeagueId: number;
  dynastyLeague: DynastyLeague;
  incomingUser: Omit<User, "rank" | "points">;
  outgoingUser: Omit<User, "rank" | "points">;
};
