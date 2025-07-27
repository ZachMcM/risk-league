import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, View } from "react-native";
import MatchTabs from "~/components/matches/MatchTabs";
import { useSession } from "~/components/providers/SessionProvider";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { getMatches } from "~/endpoints";

export default function Matches() {
  const { session } = useSession();

  if (!session) return;

  const { data: matches, isPending: isMatchesPending } = useQuery({
    queryKey: ["matches", session.user.id],
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
