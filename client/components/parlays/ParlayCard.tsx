import { Link, router, useLocalSearchParams } from "expo-router";
import { Pressable, View } from "react-native";
import { getFlexMultiplier, getPerfectPlayMultiplier } from "~/lib/utils";
import { Parlay } from "~/types/parlays";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";

export default function ParlayCard({ parlay }: { parlay: Parlay }) {
  const searchParams = useLocalSearchParams<{ matchId: string }>();
  const matchId = parseInt(searchParams.matchId);

  return (
    <Link
      href={{
        pathname: "/matches/[matchId]/parlays/[parlayId]",
        params: { matchId, parlayId: parlay.id },
      }}
    >
      <Card className="w-full">
        <CardContent className="p-6 flex flex-col gap-6 w-full flex-1">
          <View className="flex flex-col">
            <View className="flex flex-row justify-between items-center">
              <View className="flex flex-row items-center gap-3">
                <Text className="font-bold text-lg capitalize">
                  {parlay.parlayPicks.length} Pick {parlay.type} Play
                </Text>
                <Text className="font-bold text-lg text-primary">
                  {parlay.type == "flex"
                    ? `${getFlexMultiplier(
                        parlay.parlayPicks.length,
                        2
                      )}x-${getFlexMultiplier(
                        parlay.parlayPicks.length,
                        parlay.parlayPicks.length
                      )}x`
                    : `${getPerfectPlayMultiplier(parlay.parlayPicks.length)}x`}
                </Text>
              </View>
              <Badge
                variant={
                  parlay.resolved
                    ? parlay.delta > 0
                      ? "success"
                      : "destructive"
                    : "default"
                }
              >
                <Text className="text-sm">
                  {!parlay.resolved
                    ? "Active"
                    : parlay.delta > 0
                    ? "Won"
                    : "Lost"}
                </Text>
              </Badge>
            </View>
            <Text className="font-semibold text-muted-foreground">
              {parlay.parlayPicks
                .map((pick) => pick.prop.player.name)
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
                  : parlay.delta > 0
                  ? "Amount Won"
                  : "Amount Lost"}
              </Text>
              <Text className="font-bold text-2xl">
                $
                {!parlay.resolved
                  ? (
                      (parlay.type == "flex"
                        ? getFlexMultiplier(
                            parlay.parlayPicks.length,
                            parlay.parlayPicks.length
                          )
                        : getPerfectPlayMultiplier(parlay.parlayPicks.length)) *
                      parlay.stake
                    ).toFixed(2)
                  : Math.abs(parlay.delta).toFixed(2)}
              </Text>
            </View>
          </View>
          {/* TODO images go under here */}
        </CardContent>
      </Card>
    </Link>
  );
}
