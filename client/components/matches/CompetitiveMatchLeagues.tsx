import { useQueries } from "@tanstack/react-query";
import { ScrollView, View } from "react-native";
import { getTodayPropsCount } from "~/endpoints";
import { LEAGUES } from "~/lib/config";
import { Text } from "../ui/text";
import PlayButton from "./PlayButton";

export default function CompetitiveMatchLeagues() {
  const leagueQueries = useQueries({
    queries: LEAGUES.map((league) => ({
      queryKey: ["props-games-count", league],
      queryFn: () => getTodayPropsCount(league),
      staleTime: 60 * 1000,
    })),
  });

  const leagueData = LEAGUES.map((league, index) => ({
    league,
    propCount: leagueQueries[index]?.data?.availableProps || 0,
    isLoading: leagueQueries[index]?.isPending,
  }));

  const sortedLeagues = leagueData
    .sort((a, b) => b.propCount - a.propCount)
    .map(item => item.league);

  return (
    <View className="flex flex-1 flex-col px-6 gap-4 w-full">
      <Text className="text-3xl font-bold">Competitive</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          display: "flex",
          gap: 12,
          paddingRight: 16,
        }}
      >
        {sortedLeagues.map((league) => (
          <PlayButton key={league} league={league} />
        ))}
      </ScrollView>
    </View>
  );
}
