import { Level, RankInfo, Tier } from "~/types/ranks";
import { RankGradient } from "./rank-gradient";
import { StyleProp, ViewStyle } from "react-native";
import { Text } from "./text";
import { cn, rankForeground } from "~/lib/utils";

export default function RankBadge({
  tier,
  level,
  gradientStyle,
  textClassName,
}: {
  tier: Tier;
  level: Level | null;
  gradientStyle?: StyleProp<ViewStyle>;
  textClassName?: string;
}) {
  return (
    <RankGradient
      style={[{ paddingHorizontal: 16, paddingVertical: 8 }, gradientStyle]}
      tier={tier}
    >
      <Text
        className={cn(
          "font-semibold text-xl",
          rankForeground(tier),
          textClassName
        )}
      >
        {tier} {level}
      </Text>
    </RankGradient>
  );
}
