import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, View } from "react-native";
import FlexPlayOutcomes from "~/components/parlays/FlexPlayOutcomes";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Separator } from "~/components/ui/separator";
import { Text } from "~/components/ui/text";
import { getParlay } from "~/endpoints";

import PickCard from "~/components/parlays/PickCard";
import { Badge } from "~/components/ui/badge";
import ModalContainer from "~/components/ui/modal-container";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ChevronDown } from "~/lib/icons/ChevronDown";
import {
  getFlexMultiplier,
  getFlexMultiplierTable,
  getPerfectPlayMultiplier,
} from "~/utils/multiplierUtils";

export default function ParlayPage({ parlayId }: { parlayId: number }) {
  const { data: parlay, isPending: isParlayPending } = useQuery({
    queryKey: ["parlay", parlayId],
    queryFn: async () => await getParlay(parlayId),
  });

  return (
    <ModalContainer>
      <ScrollContainer className="pt-10">
        {isParlayPending ? (
          <ActivityIndicator className="text-foreground p-4" />
        ) : (
          parlay && (
            <View className="flex flex-col gap-8">
              <View className="flex flex-col gap-1 items-center">
                <Text className="font-bold text-3xl capitalize">
                  {parlay.picks.length} Pick {parlay.type} Play
                </Text>
                <Popover>
                  <PopoverTrigger disabled={parlay.type == "perfect"} asChild>
                    <Pressable className="flex flex-row items-center gap-1">
                      <Text className="font-semibold text-lg text-primary">
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
                          : `${getPerfectPlayMultiplier(
                              parlay.picks.length
                            ).toFixed(2)}x`}
                      </Text>
                      {parlay.type == "flex" && (
                        <ChevronDown className="text-primary" size={18} />
                      )}
                    </Pressable>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-4/5 flex flex-col gap-3"
                    align="center"
                    portalHost="inside-modal-page"
                  >
                    <Text className="font-bold text-lg">
                      Flex Play Payout Outcomes
                    </Text>
                    <FlexPlayOutcomes
                      length={parlay.picks.length}
                      stake={parlay.stake}
                    />
                  </PopoverContent>
                </Popover>
              </View>
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-col items-center flex-1 w-full">
                  <Text className="text-muted-foreground font-semibold">
                    Stake
                  </Text>
                  <Text className="font-bold text-2xl">${parlay.stake}</Text>
                </View>
                <View className="flex flex-col gap-1 items-center">
                  <Separator className="h-6" orientation="vertical" />
                  <Badge
                    variant={
                      parlay.resolved
                        ? parlay.profit > 0
                          ? "success"
                          : "destructive"
                        : "default"
                    }
                  >
                    <Text className="text-base">
                      {parlay.resolved
                        ? parlay.profit > 0
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
                      : parlay.profit > 0
                      ? "Net Gain"
                      : "Net Loss"}
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
                      : Math.abs(parlay.profit).toFixed(2)}
                  </Text>
                </View>
              </View>
              <View className="flex flex-col gap-4">
                {parlay.picks.map((pick) => (
                  <PickCard initialData={pick} key={pick.id} />
                ))}
              </View>
            </View>
          )
        )}
      </ScrollContainer>
    </ModalContainer>
  );
}