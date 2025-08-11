import { Link, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Parlay } from "~/types/parlay";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";
import {
  getFlexMultiplier,
  getFlexMultiplierTable,
  getPerfectPlayMultiplier,
} from "~/utils/multiplierUtils";

export default function ParlayCard({ parlay }: { parlay: Parlay }) {
  const searchParams = useLocalSearchParams<{ matchId: string }>();
  const matchId = parseInt(searchParams.matchId);

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
              {parlay.picks.map((pick) => pick.prop.player.name).join(", ")}
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
          {/* TODO images go under here */}
        </CardContent>
      </Card>
    </Link>
  );
}
