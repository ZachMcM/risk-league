import { StyleProp, ViewStyle } from "react-native";
import { Level, Tier } from "~/types/ranks";
import { RankGradient } from "./rank-gradient";
import { RankText } from "./rank-text";
import { cn } from "~/lib/utils";
import { LogoIcon } from "./logo-icon";

export default function RankBadge({
  tier,
  level,
  gradientStyle,
  textClassName,
  iconClassName,
  showIcon = false,
}: {
  tier: Tier;
  level: Level | null;
  gradientStyle?: StyleProp<ViewStyle>;
  textClassName?: string;
  iconClassName?: string;
  showIcon?: boolean;
}) {
  return (
    <RankGradient
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: 4,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        gradientStyle,
      ]}
      tier={tier}
    >
      {showIcon && (
        <LogoIcon
          className={cn(
            tier == "Bronze"
              ? "!text-amber-600"
              : tier == "Silver"
              ? "!text-gray-400"
              : tier == "Gold"
              ? "!text-yellow-500"
              : tier == "Platinum"
              ? "!text-blue-400"
              : tier == "Diamond"
              ? "!text-sky-500"
              : tier == "Master"
              ? "!text-purple-500"
              : tier == "Elite"
              ? "!text-fuchsia-500"
              : "!text-rose-500",
            "h-5 w-5",
            iconClassName
          )}
        />
      )}
      <RankText tier={tier} className={cn("font-bold", textClassName)}>
        {tier} {level}
      </RankText>
    </RankGradient>
  );
}
