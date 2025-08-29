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

export type DynastyLeagueInvitation = {
  id: number,
  createdAt: string,
  status: "pending" | "declined" | "accepted",
  outgoingId: string,
  incomingId: string,
  dynastyLeagueId: number,
  dynastyLeague: DynastyLeague,
  incomingUser: Omit<User, "rank" | "points">,
  outgoingUser: Omit<User, "rank" | "points">
}