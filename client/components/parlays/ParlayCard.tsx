import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useInterstitialAd } from "react-native-google-mobile-ads";
import Purchases from "react-native-purchases";
import { toast } from "sonner-native";
import { getParlay } from "~/endpoints";
import { interstitialAdUnitId } from "~/lib/ads";
import { Parlay } from "~/types/parlay";
import { cn } from "~/utils/cn";
import { sqlToJsDate } from "~/utils/dateUtils";
import {
  getFlexMultiplier,
  getFlexMultiplierTable,
  getPerfectPlayMultiplier,
} from "~/utils/multiplierUtils";
import { formatName } from "~/utils/stringUtils";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import PlayerImage from "../ui/player-image";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";
import { useEntitlements } from "../providers/EntitlementsProvider";

export default function ParlayCard({ initialData }: { initialData: Parlay }) {
  const searchParams = useLocalSearchParams<{
    matchId?: string;
    dynastyLeagueId?: string;
  }>();

  const { data: parlay } = useQuery({
    initialData,
    queryKey: ["parlay", initialData.id],
    queryFn: async () => await getParlay(initialData.id),
  });

  const {
    isLoaded: isAdLoaded,
    load: loadAd,
    show: showAd,
  } = useInterstitialAd(interstitialAdUnitId);

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  const { adFreeEntitlementPending, adFreeEntitlement } = useEntitlements();

  useEffect(() => {
    const showAdIfAllowed = async () => {
      if (
        isAdLoaded &&
        !adFreeEntitlementPending &&
        !adFreeEntitlement &&
        new Date().getTime() - sqlToJsDate(parlay.createdAt).getTime() <= 20000
      ) {
        toast.dismiss();
        showAd();
      }
    };

    showAdIfAllowed();
  }, [isAdLoaded, parlay, adFreeEntitlement, adFreeEntitlementPending]);

  return (
    <Link
      href={{
        pathname: searchParams.matchId
          ? "/match/[matchId]/parlays/[parlayId]"
          : "/dynastyLeague/[dynastyLeagueId]/parlays/[parlayId]",
        params: {
          matchId: searchParams.matchId!,
          parlayId: parlay.id,
          dynastyLeagueId: searchParams.dynastyLeagueId!,
        },
      }}
    >
      <Card className="w-full">
        <CardContent className="p-4 flex flex-col gap-6 w-full flex-1">
          <View className="flex flex-col">
            <View className="flex flex-row justify-between items-center">
              <View className="flex flex-row items-center gap-3">
                <Text className="font-bold text-lg capitalize">
                  {parlay.picks.length} Pick {parlay.type} Play
                </Text>
                <Text className="font-bold text-lg text-primary">
                  {parlay.type == "flex"
                    ? `${(() => {
                        const table = getFlexMultiplierTable(
                          parlay.picks.length
                        );
                        const minMultiplier =
                          table[table.length - 1]?.multiplier || 0;
                        const maxMultiplier = table[0]?.multiplier || 0;
                        return `${minMultiplier.toFixed(
                          2
                        )}x-${maxMultiplier.toFixed(2)}x`;
                      })()}`
                    : `${getPerfectPlayMultiplier(parlay.picks.length).toFixed(
                        2
                      )}x`}
                </Text>
              </View>
              <Badge
                variant={
                  parlay.resolved
                    ? parlay.payout > parlay.stake
                      ? "success"
                      : parlay.payout == parlay.stake
                      ? "secondary"
                      : "destructive"
                    : "default"
                }
                className="px-3.5"
              >
                <Text className="text-sm">
                  {!parlay.resolved
                    ? "Active"
                    : parlay.payout > parlay.stake
                    ? "Won"
                    : parlay.payout == parlay.stake
                    ? "Tied"
                    : "Lost"}
                </Text>
              </Badge>
            </View>
            <Text className="font-semibold text-muted-foreground">
              {parlay.picks
                .map(
                  (pick) =>
                    `${formatName(pick.prop.player.name).firstName[0]}. ${
                      formatName(pick.prop.player.name).lastName
                    }`
                )
                .join(", ")}
            </Text>
          </View>
          <View className="flex flex-row items-center gap-6">
            <View className="flex flex-col">
              <Text className="font-medium text-muted-foreground">Stake</Text>
              <Text className="font-bold text-2xl">${parlay.stake.toFixed(2)}</Text>
            </View>
            <Separator orientation="vertical" />
            <View className="flex flex-col">
              <Text className="text-muted-foreground font-semibold">
                {!parlay.resolved ? "Potential Payout" : "Payout"}
              </Text>
              <Text className="font-bold text-2xl">
                $
                {!parlay.resolved
                  ? (
                      (parlay.type == "flex"
                        ? getFlexMultiplier(
                            parlay.picks.length,
                            parlay.picks.length
                          )
                        : getPerfectPlayMultiplier(parlay.picks.length)) *
                      parlay.stake
                    ).toFixed(2)
                  : parlay.payout.toFixed(2)}
              </Text>
            </View>
          </View>
          <View className="flex flex-row items-center">
            {parlay.picks.map((pick, i) => (
              <PlayerImage
                key={pick.id}
                image={pick.prop.player.image}
                className={cn(
                  "w-16 h-16",
                  pick.status == "hit"
                    ? "border-success"
                    : pick.status == "missed"
                    ? "border-destructive"
                    : "border-border",
                  i !== 0 && "-ml-2"
                )}
              />
            ))}
          </View>
        </CardContent>
      </Card>
    </Link>
  );
}
