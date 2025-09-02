import { Image } from "expo-image";
import { View } from "react-native";
import { Rank } from "~/types/rank";
import { cn } from "~/utils/cn";

export default function RankIcon({
  rank,
  className,
  size = 48,
}: {
  rank: Omit<Rank, "minPoints" | "maxPoints">;
  className?: string;
  size?: number;
}) {
  const rookieOne = require("~/assets/images/ranks/Rookie_1.png");
  const rookieTwo = require("~/assets/images/ranks/Rookie_2.png");
  const rookieThree = require("~/assets/images/ranks/Rookie_3.png");
  const proOne = require("~/assets/images/ranks/Pro_1.png");
  const proTwo = require("~/assets/images/ranks/Pro_2.png");
  const proThree = require("~/assets/images/ranks/Pro_3.png");
  const allStarOne = require("~/assets/images/ranks/All_Star_1.png");
  const allStarTwo = require("~/assets/images/ranks/All_Star_2.png");
  const allStarThree = require("~/assets/images/ranks/All_Star_3.png");
  const superstarOne = require("~/assets/images/ranks/Superstar_1.png");
  const superstarTwo = require("~/assets/images/ranks/Superstar_2.png");
  const superstarThree = require("~/assets/images/ranks/Superstar_1.png");
  const eliteOne = require("~/assets/images/ranks/Elite_1.png");
  const eliteTwo = require("~/assets/images/ranks/Elite_2.png");
  const eliteThree = require("~/assets/images/ranks/Elite_3.png");
  const legend = require("~/assets/images/ranks/Legend.png");

  const rankImage = () => {
    if (rank.tier == "Rookie") {
      if (rank.level == "I") {
        return rookieOne;
      } else if (rank.level == "II") {
        return rookieTwo;
      } else {
        return rookieThree;
      }
    } else if (rank.tier == "Pro") {
      if (rank.level == "I") {
        return proOne;
      } else if (rank.level == "II") {
        return proTwo;
      } else {
        return proThree;
      }
    } else if (rank.tier == "All-Star") {
      if (rank.level == "I") {
        return allStarOne;
      } else if (rank.level == "II") {
        return allStarTwo;
      } else {
        return allStarThree;
      }
    } else if (rank.tier == "Superstar") {
      if (rank.level == "I") {
        return superstarOne;
      } else if (rank.level == "II") {
        return superstarTwo;
      } else {
        return superstarThree;
      }
    } else if (rank.tier == "Elite") {
      if (rank.level == "I") {
        return eliteOne;
      } else if (rank.level == "II") {
        return eliteTwo;
      } else {
        return eliteThree;
      }
    } else {
      return legend;
    }
  };

  return (
    <View className={cn(className)}>
      <Image
        source={rankImage()}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}
