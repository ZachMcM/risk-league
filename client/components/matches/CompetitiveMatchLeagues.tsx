import { useQuery } from "@tanstack/react-query";
import { ScrollView, View } from "react-native";
import { getTodayProps } from "~/endpoints";
import { LEAGUES, League } from "~/lib/config";
import { Text } from "../ui/text";
import PlayButton from "./PlayButton";

export default function CompetitiveMatchLeagues() {
  const leagueQueries = useQuery({
    queryKey: ["all-leagues-props"],
    queryFn: async () => {
      const results = await Promise.all(
        LEAGUES.map(async (league) => {
          try {
            const props = await getTodayProps({ league });
            return { league, propCount: props?.length || 0 };
          } catch {
            return { league, propCount: 0 };
          }
        })
      );
      return results.sort((a, b) => b.propCount - a.propCount);
    },
    staleTime: 60 * 1000,
  });

  const sortedLeagues = leagueQueries.data?.map(item => item.league) || LEAGUES;

  return (
    <View className="flex flex-1 flex-col gap-4 w-full">
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
