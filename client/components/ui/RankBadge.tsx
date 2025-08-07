import { StyleProp, ViewStyle } from "react-native";
import { Level, Rank, Tier } from "~/types/rank";
import { RankGradient } from "./rank-gradient";
import { RankText } from "./rank-text";
import { cn } from "~/utils/cn";
import { LogoIcon } from "./logo-icon";
import { cva } from "class-variance-authority";

export default function RankBadge({
  rank,
  gradientStyle,
  textClassName,
  iconClassName,
  showIcon = false,
}: {
  rank: Rank
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
            rank.tier == "Bronze"
              ? "!text-amber-600"
              : rank.tier == "Silver"
              ? "!text-gray-400"
              : rank.tier == "Gold"
              ? "!text-yellow-500"
              : rank.tier == "Platinum"
              ? "!text-blue-400"
              : rank.tier == "Diamond"
              ? "!text-sky-500"
              : rank.tier == "Master"
              ? "!text-purple-500"
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
