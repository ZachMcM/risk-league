import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, View } from "react-native";
import MatchTabs from "~/components/matches/MatchTabs";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import { getMatches } from "~/endpoints";

export default function Matches() {
  const { data: matches, isPending: isMatchesPending } = useQuery({
    queryKey: ["matches"],
    queryFn: getMatches,
  });

  return (
    <ScrollContainer>
      <View className="flex flex-1 flex-col gap-6">
        <Text className="font-bold text-4xl">My Matches</Text>
        {isMatchesPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          matches && <MatchTabs matches={matches} />
        )}
      </View>
    </ScrollContainer>
  );
}
