import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
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
  const { data } = authClient.useSession();

  const { data: match } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => await getMatch(matchId),
  });

  const { data: props, isPending: arePropsPending } = useQuery({
    queryKey: ["props", match?.league, data?.user.id, match?.type],
    queryFn: async () =>
      await getTodayProps(match?.league!, match?.type == "competitive"),
    enabled: !!match,
    staleTime: 1440 * 60 * 1000,
  });

  console.log(props);

  return (
    <ModalContainer>
      <Container className="pt-10 pb-0">
        {arePropsPending ? (
          <ActivityIndicator className="text-foreground p-4" />
        ) : (
          props !== undefined &&
          match !== undefined && (
            <View className="flex flex-col gap-6 flex-1">
              <View className="flex flex-row self-start items-center gap-2 border-b-2 pb-2 border-primary">
                <LeagueLogo league={match.league} size={26} />
                <Text className="font-bold text-xl">
                  {match.league.toUpperCase()} Props
                </Text>
              </View>
              <PropsView props={props} league={match.league} />
            </View>
          )
        )}
      </Container>
      <CreateParlayFooter />
    </ModalContainer>
  );
}
