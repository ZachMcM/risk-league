type LiveTeam = {
  teamId: string;
  teamName: string;
  teamCity: string;
  teamTriCode: string;
  score: number;
};

export type LiveGame = {
  gameId: string;
  period: number;
  gameClock: string;
  homeTeam: LiveTeam;
  awayTeam: LiveTeam;
};
