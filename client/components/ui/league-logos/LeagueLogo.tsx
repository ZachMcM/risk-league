import { League } from "~/lib/config";
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
  return league == "NBA" ? (
    <NbaLogo size={size} />
  ) : league == "NFL" ? (
    <NflLogo size={size} />
  ) : league == "MLB" ? (
    <MlbLogo size={size} />
  ) : (
    <NcaaLogo size={size} />
  );
}
