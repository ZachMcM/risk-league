import { Crown } from "lib/icons/Crown";
import { Shield } from "lib/icons/Shield";
import { TrendingUp } from "lib/icons/TrendingUp";
import { Trophy } from "lib/icons/Trophy";
import { View } from "react-native";
import { RankResponse } from "~/types/ranks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Progress } from "../ui/progress";
import { Text } from "../ui/text";

export function RankProgress({
  eloRating,
  currentRank,
  nextRank,
  progressToNext,
}: RankResponse) {
  return (
    <Card className="relative overflow-hidden">
      <View className="absolute right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />
      <View className="absolute rounded-full translate-y-12 -translate-x-12" />
      <CardHeader>
        <CardTitle className="text-2xl font-extrabold text-primary">
          {eloRating}
        </CardTitle>
        <CardDescription className="text-3xl font-black text-foreground">
          {currentRank.tier} {currentRank.level}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <View className="flex flex-col gap-8">
          <View className="flex flex-col gap-4">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <Text className="font-semibold text-xl text-muted-foreground">
                  Progress to {nextRank?.tier} {nextRank?.level}
                </Text>
              </View>
              <Text className="font-extrabold text-primary text-3xl">
                {progressToNext * 100}%
              </Text>
            </View>
            <View className="flex flex-col gap-4">
              <Progress value={progressToNext * 100} />
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-row gap-1 items-center">
                  <Shield size={16} className="text-muted-foreground" />
                  <Text className="text-xs text-muted-foreground">
                    {currentRank.minElo}
                  </Text>
                </View>
                <View className="flex flex-row gap-1 items-center">
                  <Trophy size={16} className="text-primary" />
                  <Text className="text-xs text-primary">{eloRating}</Text>
                </View>
                <View className="flex flex-row gap-1 items-center">
                  <Crown size={16} className="text-muted-foreground" />
                  <Text className="text-xs text-muted-foreground">
                    {currentRank.maxElo}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {nextRank && (
            <View className="p-4 bg-muted/20 rounded-lg border border-muted/40">
              <View>
                <Text className="text-lg font-bold text-foreground">
                  Next: {nextRank.tier} {nextRank.level}
                </Text>
                <Text className="text-muted-foreground font-medium">
                  Unlock at {nextRank.minElo} • {nextRank.minElo - eloRating}{" "}
                  points away
                </Text>
              </View>
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
}
