import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import GamesList from "~/components/props/GamesList";
import PropsView from "~/components/props/PropsView";
import { CreateParlayFooter } from "~/components/providers/CreateParlayProvider";
import { Container } from "~/components/ui/container";
import LeagueLogo from "~/components/ui/league-logos/LeagueLogo";
import ModalContainer from "~/components/ui/modal-container";
import { Text } from "~/components/ui/text";
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
    staleTime: 1440 * 60 * 1000,
  });

  return (
    <Container className="py-0">
      <View className="flex flex-col gap-4 flex-1">
        {isMatchPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          match && <GamesList league={match.league} />
        )}
        {arePropsPending || isMatchPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          props && match && <PropsView props={props} league={match.league} />
        )}
      </View>
    </Container>
  );
}
