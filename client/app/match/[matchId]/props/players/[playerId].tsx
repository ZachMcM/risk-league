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

  const { data: currentUserData } = authClient.useSession();

  const { data: props, isPending: arePropsPending } = useQuery({
    queryKey: [
      "player-props",
      "match",
      matchId,
      playerId,
      currentUserData?.user.id,
    ],
    queryFn: async () =>
      await getTodayPlayerProps({
        playerId,
        matchId,
      }),
    staleTime: 60 * 1000,
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
