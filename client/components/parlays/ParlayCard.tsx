import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { getParlay } from "~/endpoints";
import { Parlay } from "~/types/parlay";
import { cn } from "~/utils/cn";
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

export default function ParlayCard({ initialData }: { initialData: Parlay }) {
  const searchParams = useLocalSearchParams<{ matchId: string }>();
  const matchId = parseInt(searchParams.matchId);

  const { data: parlay } = useQuery({
    initialData,
    queryKey: ["parlay", initialData.id],
    queryFn: async () => await getParlay(initialData.id),
  });

  return (
    <Link
      href={{
        pathname: "/match/[matchId]/parlays/[parlayId]",
        params: { matchId, parlayId: parlay.id },
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
                    ? parlay.profit > 0
                      ? "success"
                      : "destructive"
                    : "default"
                }
                className="px-3.5"
              >
                <Text className="text-sm">
                  {!parlay.resolved
                    ? "Active"
                    : parlay.profit > 0
                    ? "Won"
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
              <Text className="font-bold text-2xl">${parlay.stake}</Text>
            </View>
            <Separator orientation="vertical" />
            <View className="flex flex-col">
              <Text className="text-muted-foreground font-semibold">
                {!parlay.resolved
                  ? "Potential Payout"
                  : parlay.profit > 0
                  ? "Amount Won"
                  : "Amount Lost"}
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
          <View className="flex flex-row items-center">
            {parlay.picks.map((pick, i) => (
              <PlayerImage
                key={pick.id}
                image={pick.prop.player.image}
                className={cn(
                  "bg-card",
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
