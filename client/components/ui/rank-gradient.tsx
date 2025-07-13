import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import { Tier } from "~/types/ranks";

export function RankGradient({
  tier,
  children,
  style,
}: {
  tier: Tier;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const getGradientColors = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return ["rgba(254, 154, 0, 0.2)", "rgba(225, 113, 0, 0.1)"] as const;
      case "Silver":
        return [
          "rgba(153, 161, 175, 0.2)",
          "rgba(113, 113, 123, 0.1)",
        ] as const;
      case "Gold":
        return ["rgba(240, 177, 0, 0.2)", "rgba(208, 135, 0, 0.1)"] as const;
      case "Platinum":
        return ["rgba(142, 197, 255, 0.2)", "rgba(81, 162, 255, 0.1)"] as const;
      case "Diamond":
        return ["rgba(0, 188, 255, 0.2)", "rgba(0, 166, 244, 0.1)"] as const;
      case "Master":
        return ["rgba(194, 122, 255, 0.2)", "rgba(173, 70, 255, 0.1)"] as const;
      case "Elite":
        return [
          "rgba(244, 168, 255, 0.2)",
          "rgba(237, 106, 255, 0.1)",
        ] as const;
      default:
        return ["rgba(255, 99, 126, 0.2)", "rgba(255, 32, 86, 0.1)"] as const;
    }
  };

  const getBorderColor = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return "rgba(254, 154, 0, 0.2)";
      case "Silver":
        return "rgba(153, 161, 175, 0.2)";
      case "Gold":
        return "rgba(240, 177, 0, 0.2)";
      case "Platinum":
        return "rgba(142, 197, 255, 0.2)";
      case "Diamond":
        return "rgba(0, 188, 255, 0.2)";
      case "Master":
        return "rgba(194, 122, 255, 0.2)";
      case "Elite":
        return "rgba(244, 168, 255, 0.2)";
      default:
        return "rgba(255, 99, 126, 0.2)";
    }
  };

  const { isDarkColorScheme } = useColorScheme();

  return (
    <LinearGradient
      colors={getGradientColors(tier)}
      style={[
        {
          backgroundColor: isDarkColorScheme
            ? "hsl(223.8136 0% 3.9388%)"
            : "hsl(223.8136 0.0002% 96.0587%)",
          borderRadius: 9999,
          borderWidth: 1,
          borderColor: getBorderColor(tier),
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}
