export type Team = {
  id: number;
  fullName: string | null;
  abbreviation: string | null;
  nickname: string | null;
  city: string | null;
  state: string | null;
  yearFounded: number | null;
  league: "nba" | "mlb";
};

export type Player = {
  number: string | null;
  name: string | null;
  id: number;
  teamId: number | null;
  league: "nba" | "mlb";
  updatedAt: string | null;
  position: string | null;
  height: string | null;
  weight: string | null;
  team: Team;
};

export type Prop = {
  picksCount: number;
  id: number;
  league: string;
  playerId: number | null;
  createdAt: string | null;
  resolved: boolean;
  line: number;
  currentValue: number;
  statName: string;
  choices: string[] | null;
  player: Player;
  game: Game;
  statDisplayName: string;
};

export type Game = {
  id: number;
  startTime: string;
  homeTeamId: number;
  awayTeamId: number;
  league: string;
  homeTeam: Team;
  awayTeam: Team;
};
