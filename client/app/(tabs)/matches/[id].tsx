import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import MatchStatsCard from "~/components/matches/MatchStatsCard";
import MatchStatsView from "~/components/matches/MatchStatsView";
import PageTitle from "~/components/ui/page-title";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { getMatchStats } from "~/endpoints";
import { CurrentStatus } from "~/types/matches";

export default function Match() {
  const { id } = useLocalSearchParams() as { id: string };

  const { data: matchStats, isPending: isMatchStatsPending } = useQuery({
    queryKey: ["match", id],
    queryFn: async () => getMatchStats(id),
  });

  return (
    <ScrollContainer>
      <View className="flex flex-1 flex-col gap-6">
        <PageTitle title="Match" back="/matches" />
        {isMatchStatsPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          matchStats && <MatchStatsView matchStats={matchStats} />
        )}
      </View>
    </ScrollContainer>
  );
}
