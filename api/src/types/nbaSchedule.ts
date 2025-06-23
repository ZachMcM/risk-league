type Broadcaster = {
  broadcasterScope: string;
  broadcasterMedia: string;
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterAbbreviation: string;
  broadcasterDescription: string;
  tapeDelayComments: string;
  broadcasterVideoLink: string;
  broadcasterTeamId: number;
  broadcasterRanking: number;
};

type Broadcasters = {
  nationalBroadcasters: Broadcaster[];
  nationalRadioBroadcasters: Broadcaster[];
  nationalOttBroadcasters: Broadcaster[];
  homeTvBroadcasters: Broadcaster[];
  homeRadioBroadcasters: Broadcaster[];
  homeOttBroadcasters: Broadcaster[];
  awayTvBroadcasters: Broadcaster[];
  awayRadioBroadcasters: Broadcaster[];
  awayOttBroadcasters: Broadcaster[];
};

type Team = {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  teamSlug: string;
  wins: number;
  losses: number;
  score: number;
  seed: number;
};

type PointsLeader = {
  personId: number;
  firstName: string;
  lastName: string;
  teamId: number;
  teamCity: string;
  teamName: string;
  teamTricode: string;
  points: number;
};

export type NBACdnGameData = {
  gameId: string;
  gameCode: string;
  gameStatus: number;
  gameStatusText: string;
  gameSequence: number;
  gameDateEst: string;
  gameTimeEst: string;
  gameDateTimeEst: string;
  gameDateUTC: string;
  gameTimeUTC: string;
  gameDateTimeUTC: string;
  awayTeamTime: string;
  homeTeamTime: string;
  day: string;
  monthNum: number;
  weekNumber: number;
  weekName: string;
  ifNecessary: string;
  seriesGameNumber: string;
  gameLabel: string;
  gameSubLabel: string;
  seriesText: string;
  arenaName: string;
  arenaState: string;
  arenaCity: string;
  postponedStatus: string;
  branchLink: string;
  gameSubtype: string;
  isNeutral: boolean;
  broadcasters: Broadcasters;
  homeTeam: Team;
  awayTeam: Team;
  pointsLeaders: PointsLeader[];
};
