import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useInterstitialAd } from "react-native-google-mobile-ads";
import MatchDetails from "~/components/matches/MatchDetails";
import ParlaysView from "~/components/parlays/ParlaysView";
import { Button } from "~/components/ui/button";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import { getMatch, getParlays, getTodayProps } from "~/endpoints";
import { interstitialAdUnitId } from "~/lib/ads";
import { authClient } from "~/lib/auth-client";
import { Plus } from "~/lib/icons/Plus";
import { sqlToJsDate } from "~/utils/dateUtils";

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

  const {
    isLoaded: isAdLoaded,
    load: loadAd,
    show: showAd,
  } = useInterstitialAd(interstitialAdUnitId);

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  useEffect(() => {
    if (
      isAdLoaded &&
      match &&
      new Date().getTime() - sqlToJsDate(match.createdAt).getTime() <= 60000
    ) {
      showAd();
    }
  }, [isAdLoaded, match]);

  return (
    <ScrollContainer className="pt-4">
      {isMatchPending ? (
        <ActivityIndicator className="text-foreground p-4" />
      ) : (
        match && (
          <View className="flex flex-1 flex-col gap-8">
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
    </ScrollContainer>
  );
}
