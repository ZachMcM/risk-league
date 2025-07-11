import { StyleProp, ViewStyle } from "react-native";
import { RankGradient } from "./rank-gradient";
import { Tier } from "~/types/ranks";
import { LogoIcon } from "./logo-icon";
import { cn, rankForeground } from "~/lib/utils";

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
        className={cn(rankForeground(tier), "h-8 w-8", iconClassName)}
      />
    </RankGradient>
  );
}
