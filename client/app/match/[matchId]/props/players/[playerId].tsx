import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator } from "react-native";
import PlayerProps from "~/components/props/PlayerProps";
import ModalContainer from "~/components/ui/modal-container";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { getMatch, getTodayPlayerProps } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function Player() {
  const searchParams = useLocalSearchParams<{
    playerId: string;
    matchId: string;
  }>();

  const matchId = parseInt(searchParams.matchId);
  const playerId = parseInt(searchParams.playerId);

  const { data: match } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => await getMatch(matchId),
  });

  const { data: currentUserData } = authClient.useSession();

  const { data: props, isPending: arePropsPending } = useQuery({
    queryKey: [
      "player-props",
      playerId,
      match?.league,
      currentUserData?.user.id,
      match?.type,
    ],
    queryFn: async () =>
      await getTodayPlayerProps(
        match?.league!,
        match?.type as "competitive" | "friendly",
        playerId
      ),
    enabled: !!match,
    staleTime: 1440 * 60 * 1000,
  });
  
  return (
    <ModalContainer>
      <ScrollContainer className="pt-10">
        {arePropsPending ? (
          <ActivityIndicator className="text-foreground p-4" />
        ) : (
          props && <PlayerProps playerProps={props} />
        )}
      </ScrollContainer>
    </ModalContainer>
  );
}