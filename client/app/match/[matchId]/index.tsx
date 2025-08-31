import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import MatchDetails from "~/components/matches/MatchDetails";
import ParlaysView from "~/components/parlays/ParlaysView";
import { Button } from "~/components/ui/button";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import {
  getMatch,
  getParlays,
  getTodayProps
} from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { Plus } from "~/lib/icons/Plus";

export default function Match() {
  const searchParams = useLocalSearchParams<{
    matchId: string;
    openSubRoute?: string;
    subRouteId?: string;
  }>();
  const matchId = parseInt(searchParams.matchId);
  const { data: currentUserData } = authClient.useSession();

  const router = useRouter();

  const { data: match, isPending: isMatchPending } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => await getMatch(matchId),
  });

  const { data: parlays, isPending: areParlaysPending } = useQuery({
    queryKey: ["parlays", "match", matchId, currentUserData?.user.id!],
    queryFn: async () => await getParlays({ matchId }),
  });

  const queryClient = useQueryClient();

  queryClient.prefetchQuery({
    queryKey: ["props", "match", matchId, currentUserData?.user.id],
    queryFn: async () =>
      await getTodayProps({
        matchId,
      }),
  });

  useEffect(() => {
    if (searchParams.openSubRoute === "messages") {
      router.navigate({
        pathname: "/match/[matchId]/messages",
        params: { matchId: searchParams.matchId },
      });
    } else if (
      searchParams.openSubRoute == "parlays" &&
      searchParams.subRouteId
    ) {
      router.navigate({
        pathname: "/match/[matchId]/parlays/[parlayId]",
        params: {
          matchId: searchParams.matchId,
          parlayId: searchParams.subRouteId,
        },
      });
    }
  }, [searchParams.openSubRoute, searchParams.matchId, router]);

  return (
    <ScrollContainer className="pt-4">
      <View className="flex-1">
        {isMatchPending ? (
          <ActivityIndicator className="text-foreground p-4" />
        ) : (
          match && (
            <View className="flex flex-1 flex-col gap-6">
              <MatchDetails match={match} />
              <View className="flex flex-col gap-4">
                <View className="flex flex-row items-end justify-between">
                  <Text className="font-bold text-2xl">Parlays</Text>
                  {!match.resolved && (
                    <Button
                      onPress={() =>
                        router.navigate({
                          pathname: "/match/[matchId]/props",
                          params: { matchId },
                        })
                      }
                      variant="foreground"
                      size="sm"
                      className="flex flex-row items-center gap-2 rounded-full h-10"
                    >
                      <Plus className="text-background" size={18} />
                      <Text>Create Parlay</Text>
                    </Button>
                  )}
                </View>
                {areParlaysPending ? (
                  <ActivityIndicator className="text-foreground p-4" />
                ) : (
                  parlays && <ParlaysView parlays={parlays} />
                )}
              </View>
            </View>
          )
        )}
      </View>
    </ScrollContainer>
  );
}
