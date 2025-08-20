import { StyleProp, ViewStyle } from "react-native";
import { RankGradient } from "./rank-gradient";
import { Tier } from "~/types/rank";
import { LogoIcon } from "./logo-icon";
import { cn } from "~/utils/cn";

export default function RankIcon({
  tier,
  gradientStyle,
  iconClassName,
}: {
  tier: Tier;
  gradientStyle?: StyleProp<ViewStyle>;
  iconClassName?: string;
}) {
  return (
    <RankGradient
      style={[
        {
          borderRadius: 10,
          padding: 8,
        },
        gradientStyle,
      ]}
      tier={tier}
    >
      <LogoIcon
        className={cn(
          tier == "Rookie"
            ? "!text-amber-600"
            : tier == "Pro"
            ? "!text-gray-400"
            : tier == "All-Star"
            ? "!text-yellow-500"
            : tier == "Superstar"
            ? "!text-blue-400"
            : tier == "Elite"
            ? "!text-fuchsia-500"
            : "!text-rose-500",
          "h-8 w-8",
          iconClassName
        )}
      />
    </RankGradient>
  );
}
