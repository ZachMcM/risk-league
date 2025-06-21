export type NbaScoreboardResponse = {
  meta: {
    version: number;
    request: string;
    time: string; // ISO datetime string
    code: number;
  };
  scoreboard: {
    gameDate: string; // YYYY-MM-DD
    leagueId: string;
    leagueName: string;
    games: Game[];
  };
};

type Game = {
  gameId: string;
  gameCode: string;
  gameStatus: number;
  gameStatusText: string;
  period: number;
  gameClock: string;
  gameTimeUTC: string; // ISO datetime string
  gameEt: string; // ISO datetime string
  regulationPeriods: number;
  seriesGameNumber: string;
  seriesText: string;
  homeTeam: Team;
  awayTeam: Team;
  gameLeaders: {
    homeLeaders: PlayerStats;
    awayLeaders: PlayerStats;
  };
  pbOdds: {
    team: string;
    odds: number;
    suspended: number;
  };
};

type Team = {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  wins: number;
  losses: number;
  score: number;
  inBonus: string;
  timeoutsRemaining: number;
  periods: PeriodScore[];
};

type PeriodScore = {
  period: number;
  periodType: "REGULAR" | "OVERTIME" | string;
  score: number;
};

type PlayerStats = {
  personId: number;
  name: string;
  jerseyNum: string;
  position: string;
  teamTricode: string;
  playerSlug: string;
  points: number;
  rebounds: number;
  assists: number;
};
