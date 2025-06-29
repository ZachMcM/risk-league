import { View } from "react-native";
import { CurrentStatus, UserStats } from "~/types/matches";
import MatchStatsCard from "./MatchStatsCard";
import { useMatch } from "../providers/MatchProvider";
import { useEffect } from "react";

export default function MatchStatsView() {
  const { stats } = useMatch();

  return (
    <View className="flex flex-col gap-4">
      {stats.map((userStats, i) => {
        const otherIndex = i == 0 ? 1 : 0;
        const status: CurrentStatus =
          stats[i].balance == stats[otherIndex].balance
            ? "tied"
            : stats[i].balance > stats[otherIndex].balance
            ? "winning"
            : "losing";

        return (
          <MatchStatsCard
            key={userStats.userId}
            userStats={userStats}
            status={status}
          />
        );
      })}
    </View>
  );
}
