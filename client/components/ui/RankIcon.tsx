import { StyleProp, ViewStyle } from "react-native";
import { RankGradient } from "./rank-gradient";
import { Tier } from "~/types/ranks";
import { LogoIcon } from "./logo-icon";
import { cn } from "~/lib/utils";

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
          "h-8 w-8",
          iconClassName
        )}
      />
    </RankGradient>
  );
}
