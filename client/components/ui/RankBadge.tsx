import { StyleProp, ViewStyle } from "react-native";
import { Level, Tier } from "~/types/ranks";
import { RankGradient } from "./rank-gradient";
import { RankText } from "./rank-text";

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
      <RankText tier={tier} className="font-semibold text-xl">
        {tier} {level}
      </RankText>
    </RankGradient>
  );
}
