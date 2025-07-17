export type Team = {
  id: number;
  fullName: string | null;
  abbreviation: string | null;
  nickname: string | null;
  city: string | null;
  state: string | null;
  yearFounded: number | null;
  league: "nba" | "nfl" | "mlb";
};

export type Player = {
  number: string | null;
  name: string | null;
  id: number;
  teamId: number | null;
  league: "nba" | "nfl" | "mlb";
  updatedAt: string | null;
  position: string | null;
  height: string | null;
  weight: string | null;
  team: Team
};

export type Prop = {
  parlayPicksCount: number;
  oppTeam: Team;
  id: number;
  league: "nba" | "nfl" | "mlb";
  playerId: number | null;
  createdAt: string | null;
  resolved: boolean;
  line: number;
  currentValue: number;
  rawGameId: string;
  stat: string;
  gameStartTime: string | null;
  pickOptions: string[] | null;
  oppTeamId: number | null;
  player: Player;
};
