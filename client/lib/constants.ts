export const NAV_THEME = {
  light: {
    background: "hsl(223.8136 -172.5242% 100%)", // background
    border: "hsl(223.8136 0.0001% 89.8161%)", // border
    card: "hsl(223.8136 -172.5242% 100%)", // card
    notification: "hsl(0 84.2% 60.2%)", // destructive
    primary: "hsl(324.9505 80.8% 50.9804%)", // primary
    text: "hsl(223.8136 0% 3.9388%)", // foreground
  },
  dark: {
    background: "hsl(223.8136 0% 3.9388%)", // background
    border: "hsl(223.8136 0% 15.5096%)", // border
    card: "hsl(223.8136 0% 9.0527%)", // card
    notification: "hsl(0 84.2% 60.2%)", // destructive
    primary: "hsl(324.9505 80.8% 50.9804%)", // primary
    text: "hsl(223.8136 0.0004% 98.0256%)", // foreground
  },
};

export const leagues = ["MLB", "NBA", "NFL", "NCAAFB", "NCAABB"] as const;
export type League = (typeof leagues)[number];

export const propStats = [
  {
    id: "home_runs",
    name: "Home Runs",
    league: "MLB",
  },
  {
    id: "doubles",
    name: "Doubles",
    league: "MLB",
  },
  {
    id: "hits",
    name: "Hits",
    league: "MLB",
  },
  {
    id: "triples",
    name: "Triples",
    league: "MLB",
  },
  {
    id: "rbi",
    name: "RBIs",
    league: "MLB",
  },
  {
    id: "strikeouts",
    name: "Strikeouts",
    league: "MLB",
  },
  {
    id: "pitching_strikeouts",
    name: "Pitching Strikeouts",
    league: "MLB",
  },
  {
    id: "pitches_thrown",
    name: "Pitches Thrown",
    league: "MLB",
  },
  {
    id: "earned_runs",
    name: "Earned Runs",
    league: "MLB",
  },
  {
    id: "pitching_hits",
    name: "Pitching Hits",
    league: "MLB",
  },
  {
    id: "pitching_walks",
    name: "Pitching Walks",
    league: "MLB",
  },
  {
    id: "points",
    name: "Points",
    league: "NBA",
  },
  {
    id: "rebounds",
    name: "Rebounds",
    league: "NBA",
  },
  {
    id: "assists",
    name: "Assists",
    league: "NBA",
  },
  {
    id: "three_pm",
    name: "Three Pointers Made",
    league: "NBA",
  },
  {
    id: "blocks",
    name: "Blocks",
    league: "NBA",
  },
  {
    id: "steals",
    name: "Steals",
    league: "NBA",
  },
  {
    id: "turnovers",
    name: "Turnovers",
    league: "NBA",
  },
  {
    id: "points_rebounds_assists",
    name: "Points + Rebounds + Assists",
    league: "NBA",
  },
  {
    id: "rebounds_assists",
    name: "Rebounds + Assists",
    league: "NBA",
  },
  {
    id: "points_assists",
    name: "Points + Assists",
    league: "NBA",
  },
];
