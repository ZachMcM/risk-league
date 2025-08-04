import { View } from "react-native";
import StartMatchCard from "./StartMatchCard";

export default function StartMatchList() {
  return (
    <View className="flex flex-row items-center gap-3 flex-wrap">
      <StartMatchCard
        image={require("~/assets/images/nba.jpeg")}
        league="nba"
      />
      <StartMatchCard
        image={require("~/assets/images/nfl.jpeg")}
        league="nfl"
      />

      <StartMatchCard
        image={require("~/assets/images/cfb.jpeg")}
        league="cfb"
      />
      <StartMatchCard
        image={require("~/assets/images/mcbb.jpeg")}
        league="mcbb"
      />
      <StartMatchCard
        image={require("~/assets/images/mlb.jpeg")}
        league="mlb"
      />
    </View>
  );
}
