import {
  baseball,
  basketball,
  football
} from "@lucide/lab";
import { Icon as CustomIcon } from "lucide-react-native";
import { League } from "~/lib/config";

export default function LeagueLogo({
  league,
  size = 24,
}: {
  league: League;
  size?: number;
}) {
  return ["NBA", "NCAABB"].includes(league) ? (
    <CustomIcon className="text-foreground" iconNode={basketball} size={size} />
  ) : ["NFL", "NCAAFB"].includes(league) ? (
    <CustomIcon className="text-foreground" iconNode={football} size={size} />
  ) : (
    <CustomIcon className="text-foreground" iconNode={baseball} size={size} />
  );
}
