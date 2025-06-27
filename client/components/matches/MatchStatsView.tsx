import { View } from "react-native";
import { CurrentStatus, MatchStats } from "~/types/matches";
import MatchStatsCard from "./MatchStatsCard";

interface Props {
  matchStats: MatchStats;
}

export default function MatchStatsView({ matchStats }: Props) {
  const status: CurrentStatus =
    matchStats.userStats.balance == matchStats.opponentStats.balance
      ? "tied"
      : matchStats.userStats.balance > matchStats.opponentStats.balance
      ? "winning"
      : "losing";

  const opponentStatus: CurrentStatus =
    matchStats.userStats.balance == matchStats.opponentStats.balance
      ? "tied"
      : matchStats.userStats.balance < matchStats.opponentStats.balance
      ? "winning"
      : "losing";

  return (
    <View className="flex flex-col gap-4">
      <MatchStatsCard userStats={matchStats.userStats} status={status} />
      <MatchStatsCard
        userStats={matchStats.opponentStats}
        status={opponentStatus}
        opponent
      />
    </View>
  );
}
