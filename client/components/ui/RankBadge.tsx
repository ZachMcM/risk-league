import { StyleProp, ViewStyle } from "react-native";
import { Rank } from "~/types/rank";
import { cn } from "~/utils/cn";
import { LogoIcon } from "./logo-icon";
import { RankGradient } from "./rank-gradient";
import { RankText } from "./rank-text";

export default function RankBadge({
  rank,
  gradientStyle,
  textClassName,
  iconClassName,
  showIcon = false,
}: {
  rank: Rank;
  gradientStyle?: StyleProp<ViewStyle>;
  textClassName?: string;
  iconClassName?: string;
  showIcon?: boolean;
}) {
  return (
    <RankGradient
      style={[
        {
          paddingHorizontal: 14,
          paddingVertical: 4,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        gradientStyle,
      ]}
      tier={rank.tier}
    >
      {showIcon && (
        <LogoIcon
          className={cn(
            rank.tier == "Rookie"
              ? "!text-amber-600"
              : rank.tier == "Pro"
              ? "!text-gray-400"
              : rank.tier == "All-Star"
              ? "!text-yellow-500"
              : rank.tier == "Superstar"
              ? "!text-blue-400"
              : rank.tier == "Elite"
              ? "!text-fuchsia-500"
              : "!text-rose-500",
            "h-5 w-5",
            iconClassName
          )}
        />
      )}
      <RankText tier={rank.tier} className={cn("font-bold", textClassName)}>
        {rank.tier} {rank.level}
      </RankText>
    </RankGradient>
  );
}
