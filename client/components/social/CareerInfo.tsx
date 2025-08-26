import { useQuery } from "@tanstack/react-query";
import { Fragment } from "react";
import { View } from "react-native";
import { getCareer } from "~/endpoints";
import { Career } from "~/types/user";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";
import { Text } from "../ui/text";
import { Star } from "~/lib/icons/Star";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { Trophy } from "~/lib/icons/Trophy";
import { Progress } from "../ui/progress";
import RankGraph from "../career/RankGraph";
import { Image } from "expo-image";
import PlayerImage from "../ui/player-image";

export default function CareerInfo({ userId }: { userId: string }) {
  const { data: career, isPending: isCareerPending } = useQuery({
    queryKey: ["career", userId],
    queryFn: async () => await getCareer(userId),
  });

  return (
    <Fragment>
      {isCareerPending ? (
        <View className="flex flex-col gap-3">
          <Skeleton className="h-48 flex-1 self-stretch" />
          <Skeleton className="h-48 flex-1 self-stretch" />
          <Skeleton className="h-48 flex-1 self-stretch" />
          <Skeleton className="h-48 flex-1 self-stretch" />
          <View className="flex flex-row items-center gap-3">
            <Skeleton className="h-40 flex-1 self-stretch" />
            <Skeleton className="h-40 flex-1 self-stretch" />
          </View>
        </View>
      ) : (
        career && (
          <View className="flex flex-col gap-4">
            <Card className="flex-1 self-stretch">
              <CardContent className="p-6 flex flex-col gap-4">
                <View className="flex flex-col gap-2">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="font-bold">Match Record</Text>
                    <Trophy className="text-muted-foreground" size={16} />
                  </View>
                  <Text className="text-2xl font-bold">
                    {career.matchStats.wins}-{career.matchStats.draws}-
                    {career.matchStats.losses}
                  </Text>
                </View>
                <View className="flex flex-col gap-1.5">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="font-semibold text-lg">Win Rate</Text>
                    <Text className="font-bold text-lg">
                      {career.matchStats.total == 0
                        ? "0%"
                        : `${Math.round(
                            (career.matchStats.wins / career.matchStats.total) *
                              100
                          )}%`}
                    </Text>
                  </View>
                  <Progress
                    value={
                      career.matchStats.total == 0
                        ? 0
                        : career.matchStats.wins / career.matchStats.total
                    }
                    variant="primary"
                  />
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-muted-foreground font-semibold">
                      {career.matchStats.wins} wins
                    </Text>
                    <Text className="text-muted-foreground font-semibold">
                      {career.matchStats.draws} draws
                    </Text>
                    <Text className="text-muted-foreground font-semibold">
                      {career.matchStats.losses} losses
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
            <Card className="flex-1 self-stretch">
              <CardContent className="p-6 flex flex-col gap-4">
                <View className="flex flex-col gap-2">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="font-bold">Points Timeline</Text>
                    <TrendingUp className="text-muted-foreground" size={16} />
                  </View>
                </View>
                {career.pointsTimeline.length > 0 ? (
                  <RankGraph
                    pointsTimeline={career.pointsTimeline}
                    peakRank={career.peakRank}
                    currentRank={career.currentRank}
                  />
                ) : (
                  <View className="h-48 flex items-center justify-center">
                    <Text className="text-muted-foreground">
                      No timeline data available
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>
            <Card className="flex-1 self-stretch">
              <CardContent className="p-6 flex flex-col gap-4">
                <View className="flex flex-col gap-2">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="font-bold">Parlay Record</Text>
                    <Trophy className="text-muted-foreground" size={16} />
                  </View>
                  <Text className="text-2xl font-bold">
                    {career.parlayStats.wins}-{career.parlayStats.losses}
                  </Text>
                </View>
                <View className="flex flex-col gap-1.5">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="font-semibold text-lg">Win Rate</Text>
                    <Text className="font-bold text-lg">
                      {career.parlayStats.total == 0
                        ? "0%"
                        : `${Math.round(
                            (career.parlayStats.wins /
                              career.parlayStats.total) *
                              100
                          )}%`}
                    </Text>
                  </View>
                  <Progress
                    value={
                      career.parlayStats.total == 0
                        ? 0
                        : career.parlayStats.wins / career.parlayStats.total
                    }
                    variant="primary"
                  />
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-muted-foreground font-semibold">
                      {career.parlayStats.wins} wins
                    </Text>
                    <Text className="text-muted-foreground font-semibold">
                      {career.parlayStats.losses} losses
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
            {career.mostBetPlayer && career.mostBetTeam && (
              <View className="flex flex-row items-center gap-4">
                <Card className="flex-1 self-stretch">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <View className="flex flex-row items-center justify-between">
                      <Text className="font-bold">Most Bet Player</Text>
                      <Star className="text-muted-foreground" size={16} />
                    </View>
                    <View className="flex flex-col gap-1 items-center">
                      <PlayerImage
                        image={career.mostBetPlayer.player.image}
                        scale={1.2}
                      />
                      <Text className="text-2xl font-bold text-center">
                        {career.mostBetPlayer.player.name}
                      </Text>
                      <Text className="text-muted-foreground font-semibold text-center">
                        {career.mostBetPlayer.count} Picks Placed
                      </Text>
                    </View>
                  </CardContent>
                </Card>
                <Card className="flex-1 self-stretch">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <View className="flex flex-row items-center justify-between">
                      <Text className="font-bold">Most Bet Team</Text>
                      <Star className="text-muted-foreground" size={16} />
                    </View>
                    <View className="flex flex-col gap-1 items-center">
                      {career.mostBetTeam.team.image && (
                        <Image
                          source={{
                            uri: career.mostBetTeam.team.image,
                          }}
                          style={{ width: 50, height: 50 }}
                        />
                      )}
                      <Text className="text-2xl font-bold text-center">
                        {career.mostBetTeam.team.fullName}
                      </Text>
                      <Text className="text-muted-foreground font-semibold text-center">
                        {career.mostBetTeam.count} Picks Placed
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              </View>
            )}
            <Card className="flex-1 self-stretch">
              <CardContent className="p-6 flex flex-col gap-3">
                <Text className="font-bold text-2xl">Summary</Text>
                <View className="flex flex-row items-center flex-wrap gap-4 self-start">
                  <View className="flex flex-col items-center w-[47%]">
                    <Text className="font-bold text-2xl text-primary text-center">
                      {career.matchStats.total}
                    </Text>
                    <Text className="text-muted-foreground text-center">
                      Total Matches
                    </Text>
                  </View>
                  <View className="flex flex-col items-center w-[47%]">
                    <Text className="font-bold text-2xl text-primary text-center">
                      {career.parlayStats.total}
                    </Text>
                    <Text className="text-muted-foreground text-center">
                      Total Parlays
                    </Text>
                  </View>
                  <View className="flex flex-col items-center w-[47%]">
                    <Text className="font-bold text-2xl text-primary text-center">
                      {career.matchStats.total == 0
                        ? 0
                        : (career.matchStats.wins / career.matchStats.total) *
                          100}
                      %
                    </Text>
                    <Text className="text-muted-foreground text-center">
                      Match Win Rate
                    </Text>
                  </View>
                  <View className="flex flex-col items-center w-[47%]">
                    <Text className="font-bold text-2xl text-primary text-center">
                      {career.parlayStats.total == 0
                        ? 0
                        : (career.parlayStats.wins / career.parlayStats.total) *
                          100}
                      %
                    </Text>
                    <Text className="text-muted-foreground text-center">
                      Parlay Win Rate
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        )
      )}
    </Fragment>
  );
}
