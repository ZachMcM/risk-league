import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, View } from "react-native";
import MatchTabs from "~/components/matches/MatchTabs";
import { Container } from "~/components/ui/container";
import { getMatches } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function Matches() {
  const { data } = authClient.useSession();

  const { data: matches, isPending: isMatchesPending } = useQuery({
    queryKey: ["matches", data?.user.id],
    queryFn: async () => await getMatches(),
  });

  return (
    <Container className="pt-2">
      <View className="flex flex-1 flex-col gap-6">
        {isMatchesPending ? (
          <ActivityIndicator className="text-foreground p-4" />
        ) : (
          matches && <MatchTabs matches={matches} />
        )}
      </View>
    </Container>
  );
}
