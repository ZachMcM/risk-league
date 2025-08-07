import { League } from "~/lib/constants";
import MlbLogo from "./MlbLogo";
import NbaLogo from "./NbaLogo";
import NcaaLogo from "./NcaaLogo";
import NflLogo from "./NflLogo";

export default function LeagueLogo({
  league,
  size,
}: {
  league: League;
  size?: number;
}) {
  return league == "nba" ? (
    <NbaLogo size={size} />
  ) : league == "nfl" ? (
    <NflLogo size={size} />
  ) : league == "mlb" ? (
    <MlbLogo size={size} />
  ) : (
    <NcaaLogo size={size} />
  );
}
