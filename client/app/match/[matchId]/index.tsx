import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useInterstitialAd } from "react-native-google-mobile-ads";
import { toast } from "sonner-native";
import FirstMatchDialog from "~/components/matches/FirstMatchDialog";
import MatchDetails from "~/components/matches/MatchDetails";
import ParlaysView from "~/components/parlays/ParlaysView";
import { Button } from "~/components/ui/button";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import {
  getMatch,
  getMatchIds,
  getOpponentParlays,
  getParlays,
  getTodayProps,
} from "~/endpoints";
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
  const [isFirstMatchDialogOpen, setIsFirstMatchDialogOpen] = useState(false);

  const { data: match, isPending: isMatchPending } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => await getMatch(matchId),
  });

  const { data: parlays, isPending: areParlaysPending } = useQuery({
    queryKey: ["parlays", "match", matchId, currentUserData?.user.id!],
    queryFn: async () => await getParlays({ matchId }),
  });

  const { data: opponentParlays } = useQuery({
    queryKey: ["parlays", "opponent", "match", matchId],
    queryFn: async () => getOpponentParlays(matchId),
  });

  const { data: unresolvedMatchIds, isPending: unresolvedMatchesPending } =
    useQuery({
      queryKey: ["match-ids", currentUserData?.user.id, "unresolved"],
      queryFn: async () => await getMatchIds(false),
    });

  const { data: resolvedMatchIds, isPending: resolvedMatchesPending } =
    useQuery({
      queryKey: ["match-ids", currentUserData?.user.id, "resolved"],
      queryFn: async () => await getMatchIds(true),
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
      new Date().getTime() - sqlToJsDate(match.createdAt).getTime() <= 20000
    ) {
      toast.dismiss();
      showAd();
    }
  }, [isAdLoaded, match]);

  useEffect(() => {
    if (
      unresolvedMatchIds &&
      resolvedMatchIds &&
      unresolvedMatchIds.length === 1 &&
      resolvedMatchIds.length === 0
    ) {
      setIsFirstMatchDialogOpen(true);
    }
  }, [unresolvedMatchIds, resolvedMatchIds]);

  return (
    <ScrollContainer className="p-4 pb-12">
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
                parlays && (
                  <ParlaysView
                    opponentParlays={
                      match.resolved ? opponentParlays : undefined
                    }
                    parlays={parlays}
                  />
                )
              )}
            </View>
          </View>
        )
      )}
      <FirstMatchDialog
        isOpen={isFirstMatchDialogOpen}
        onOpenChange={setIsFirstMatchDialogOpen}
        close={() => setIsFirstMatchDialogOpen(false)}
      />
    </ScrollContainer>
  );
}
