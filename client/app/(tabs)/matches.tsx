import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, View } from "react-native";
import MatchTabs from "~/components/matches/MatchTabs";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { getMatches } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function Matches() {
  const { data } = authClient.useSession();

  const { data: matches, isPending: isMatchesPending } = useQuery({
    queryKey: ["matches", data?.user.id],
    queryFn: async () => await getMatches(),
  });

  return (
    <ScrollContainer>
      <View className="flex flex-1 flex-col gap-6">
        {isMatchesPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          matches && <MatchTabs matches={matches} />
        )}
      </View>
    </ScrollContainer>
  );
}
