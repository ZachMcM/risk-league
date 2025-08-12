import { League } from "~/lib/constants";

export type Team = {
  teamId: number;
  fullName: string;
  abbreviation: string | null;
  location: string | null
  mascot: string | null
  league: League;
};

export type Player = {
  number: string;
  name: string;
  playerId: number;
  teamId: number;
  league: League;
  updatedAt: string;
  position: string | null;
  height: string | null;
  weight: number | null;
  team: Team;
};

export type Prop = {
  id: number;
  league: League;
  playerId: number;
  createdAt: string;
  resolved: boolean;
  line: number;
  currentValue: number;
  statName: string;
  choices: string[];
  player: Player;
  game: Game;
  statDisplayName: string;
};

export type Game = {
  gameId: string;
  startTime: string;
  homeTeamId: number;
  awayTeamId: number;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
};
