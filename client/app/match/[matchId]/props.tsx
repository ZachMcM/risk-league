import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import PropsView from "~/components/props/PropsView";
import {
  ParlayPickerFooter,
  ParlayProvider,
} from "~/components/providers/ParlayProvider";
import { Container } from "~/components/ui/container";
import LeagueLogo from "~/components/ui/league-logos/LeagueLogo";
import ModalContainer from "~/components/ui/modal-container";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import { getMatch, getTodayProps } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { formatDate } from "~/utils/dateUtils";

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
    queryKey: ["props", matchId, data?.user.id],
    queryFn: async () => await getTodayProps(match?.league!),
    enabled: !!match,
  });

  console.log(props);

  return (
    <ModalContainer>
      <Container className="flex-col gap-4 pt-10 pb-0 flex-1 flex-grow">
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
      <ParlayPickerFooter />
    </ModalContainer>
  );
}
