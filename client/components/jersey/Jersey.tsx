import React from "react";
import { FootballJersey } from "./FootballJersey";
import { BaseballJersey } from "./BaseballJersey";
import { BasketballJersey } from "./BasketballJersey";
import { League } from "~/lib/config";

interface JerseyProps {
  league: League;
  color: string;
  alternateColor: string;
  jerseyNumber: string;
  size: number;
  teamName: string;
}

export const Jersey: React.FC<JerseyProps> = ({
  league,
  color,
  alternateColor,
  jerseyNumber,
  teamName,
  size,
}) => {
  return ["MLB"].includes(league) ? (
    <BaseballJersey
      color={color}
      alternateColor={alternateColor}
      jerseyNumber={jerseyNumber}
      size={size}
      teamName={teamName}
    />
  ) : ["NCAAFB", "NFL"].includes(league) ? (
    <FootballJersey
      color={color}
      alternateColor={alternateColor}
      jerseyNumber={jerseyNumber}
      size={size}
      teamName={teamName}
    />
  ) : (
    <BasketballJersey
      color={color}
      alternateColor={alternateColor}
      jerseyNumber={jerseyNumber}
      size={size}
      teamName={teamName}
    />
  );
};
