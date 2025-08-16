// Generic injury types
export type InjuryEntry = {
  injury: string;
  player: string;
  status: string;
  returns: string;
  player_id: string;
  date_injured: string;
}

export type TeamInjuriesEntry = {
  team: string;
  team_id: number;
  injuries: InjuryEntry[];
}

export type LeagueInjuries<T extends string = string> = {
  data: {
    [league in T]: TeamInjuriesEntry[];
  }
}

// Specific league injury types
export type MLBInjuries = LeagueInjuries<"MLB">
export type NBAInjuries = LeagueInjuries<"NBA">
export type NFLInjuries = LeagueInjuries<"NFL">

export type DepthChartPlayer = {
  id: number;
  player: string;
}

export type PositionDepthChart = {
  [depth: string]: DepthChartPlayer;
}

export type TeamDepthChart = {
  [position: string]: PositionDepthChart | number;
  team_id: number;
}

export type LeagueDepthCharts<T extends string = string> = {
  [league in T]: {
    [teamName: string]: TeamDepthChart;
  }
}

export type MLBDepthCharts = LeagueDepthCharts<"MLB">
export type NBADepthCharts = LeagueDepthCharts<"NBA">
export type NFLDepthCharts = LeagueDepthCharts<"NFL">