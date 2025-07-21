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
  parlayPicksCount: number;
  id: number;
  league: "nba" | "mlb";
  playerId: number | null;
  createdAt: string | null;
  resolved: boolean;
  line: number;
  currentValue: number;
  rawGameId: string;
  stat: string;
  gameStartTime: string | null;
  pickOptions: string[] | null;
  player: Player;
};

export const propStats = [
  {
    id: "home_runs",
    name: "Home Runs",
  },
  {
    id: "doubles",
    name: "Doubles",
  },
  {
    id: "hits",
    name: "Hits",
  },
  {
    id: "triples",
    name: "Triples",
  },
  {
    id: "rbi",
    name: "RBIs",
  },
  {
    id: "strikeouts",
    name: "Strikeouts",
  },
  {
    id: "pitching_strikeouts",
    name: "Pitching Strikeouts",
  },
  {
    id: "pitches_thrown",
    name: "Pitches Thrown",
  },
  {
    id: "earned_runs",
    name: "Earned Runs",
  },
  {
    id: "pitching_hits",
    name: "Pitching Hits",
  },
  {
    id: "pitching_walks",
    name: "Pitching Walks",
  },
  {
    id: "pts",
    name: "Points",
  },
  {
    id: "reb",
    name: "Rebounds",
  },
  {
    id: "ast",
    name: "Assists",
  },
  {
    id: "three_pm",
    name: "Three Pointers Made",
  },
  {
    id: "blk",
    name: "Blocks",
  },
  {
    id: "stl",
    name: "Steals",
  },
  {
    id: "tov",
    name: "Turnovers",
  },
  {
    id: "pra",
    name: "Points + Rebounds + Assists",
  },
  {
    id: "reb_ast",
    name: "Rebounds + Assists",
  },
  {
    id: "pts_ast",
    name: "Points + Assists",
  },
];
