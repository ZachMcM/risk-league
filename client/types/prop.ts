import { League } from "~/lib/config";

export type Team = {
  teamId: number;
  fullName: string;
  abbreviation: string | null;
  location: string | null;
  mascot: string | null;
  league: League;
  image: string | null
  color: string | null
  alternateColor: string | null
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
  image: string | null
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

export type TodayPlayerProps = {
  player: Player;
  games: Game[];
  props: (Prop & {
    previousResults: { time: string; value: number }[];
  })[];
};
