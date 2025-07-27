import { PortalHost } from "@rn-primitives/portal";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import FlexPlayOutcomes from "~/components/parlays/FlexPlayOutcomes";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Progress } from "~/components/ui/progress";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Separator } from "~/components/ui/separator";
import { Text } from "~/components/ui/text";
import { getParlay } from "~/endpoints";

import { ChevronDown } from "~/lib/icons/ChevronDown";
import {
  cn,
  getFlexMultiplier,
  getPerfectPlayMultiplier,
  getStatName,
} from "~/lib/utils";
import ModalContainer from "~/components/ui/modal-container";
import ParlayPickCard from "~/components/parlays/ParlayPickCard";
import { Badge } from "~/components/ui/badge";

export default function Parlay() {
  const searchParams = useLocalSearchParams<{
    matchId: string;
    parlayId: string;
  }>();

  const parlayId = parseInt(searchParams.parlayId);

  const { data: parlay, isPending: isParlayPending } = useQuery({
    queryKey: ["parlay", parlayId],
    queryFn: async () => await getParlay(parlayId),
  });

  return (
    <ModalContainer>
      <ScrollContainer className="pt-6">
        {isParlayPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          parlay && (
            <View className="flex flex-col gap-8">
              <View className="flex flex-col gap-1 items-center">
                <Text className="font-bold text-3xl capitalize">
                  {parlay.parlayPicks.length} Pick {parlay.type} Play
                </Text>
                <View className="flex flex-row items-center gap-1">
                  <Text className="font-semibold text-lg text-primary">
                    {parlay.type == "flex"
                      ? `${getFlexMultiplier(
                          parlay.parlayPicks.length,
                          2
                        )}x-${getFlexMultiplier(
                          parlay.parlayPicks.length,
                          parlay.parlayPicks.length
                        )}x`
                      : `${getPerfectPlayMultiplier(
                          parlay.parlayPicks.length
                        )}x`}
                  </Text>
                  {parlay.type == "flex" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Pressable>
                          <ChevronDown className="text-primary" size={18} />
                        </Pressable>
                      </DialogTrigger>
                      <DialogContent
                        className="w-[375px]"
                        portalHost="modal-portal"
                      >
                        <DialogHeader>
                          <Text className="font-bold text-lg">
                            Flex Play Payout Outcomes
                          </Text>
                        </DialogHeader>
                        <FlexPlayOutcomes
                          length={parlay.parlayPicks.length}
                          stake={parlay.stake}
                        />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button>
                              <Text>Close</Text>
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </View>
              </View>
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-col items-center flex-1 w-full">
                  <Text className="text-muted-foreground font-semibold">
                    Stake
                  </Text>
                  <Text className="font-bold text-3xl">${parlay.stake}</Text>
                </View>
                <View className="flex flex-col gap-1 items-center">
                  <Separator className="h-6" orientation="vertical" />
                  <Badge
                    variant={
                      parlay.resolved
                        ? parlay.delta > 0
                          ? "success"
                          : "destructive"
                        : "default"
                    }
                  >
                    <Text className="text-base">
                      {parlay.resolved
                        ? parlay.delta > 0
                          ? "Won"
                          : "Lost"
                        : "Active"}
                    </Text>
                  </Badge>
                  <Separator className="h-6" orientation="vertical" />
                </View>
                <View className="flex flex-col items-center flex-1 w-full">
                  <Text className="text-muted-foreground font-semibold">
                    {!parlay.resolved
                      ? "Potential Payout"
                      : parlay.delta > 0
                      ? "Amount Won"
                      : "Amount Lost"}
                  </Text>
                  <Text className="font-bold text-3xl">
                    $
                    {!parlay.resolved
                      ? (
                          (parlay.type == "flex"
                            ? getFlexMultiplier(
                                parlay.parlayPicks.length,
                                parlay.parlayPicks.length
                              )
                            : getPerfectPlayMultiplier(
                                parlay.parlayPicks.length
                              )) * parlay.stake
                        ).toFixed(2)
                      : Math.abs(parlay.delta).toFixed(2)}
                  </Text>
                </View>
              </View>
              <View className="flex flex-col gap-4">
                {parlay.parlayPicks.map((pick) => (
                  <ParlayPickCard pick={pick} key={pick.id} />
                ))}
              </View>
            </View>
          )
        )}
      </ScrollContainer>
    </ModalContainer>
  );
}
