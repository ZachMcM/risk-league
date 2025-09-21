import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import PropsView from "~/components/props/PropsView";
import { Container } from "~/components/ui/container";
import { getMatch, getTodayProps } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function Props() {
  const searchParams = useLocalSearchParams<{
    matchId: string;
  }>();
  const matchId = parseInt(searchParams.matchId);
  const { data: currentUserData } = authClient.useSession();

  const { data: match, isPending: isMatchPending } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => await getMatch(matchId),
  });

  const { data: props, isPending: arePropsPending } = useQuery({
    queryKey: ["props", "match", matchId, currentUserData?.user.id],
    queryFn: async () =>
      await getTodayProps({
        matchId,
      }),
    staleTime: 60 * 1000,
  });

  return (
    <Container className="py-0">
      <View className="flex flex-col gap-4 flex-1">
        {arePropsPending || isMatchPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          props && match && <PropsView props={props} league={match.league} />
        )}
      </View>
    </Container>
  );
}
