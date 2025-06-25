import { TrendingUp } from "lib/icons/TrendingUp";
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

export function RankProgress(props: RankResponse) {
  const { currentRank, nextRank, progressToNext, eloRating } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary font-bold text-4xl">{eloRating}</CardTitle>
        <CardDescription className="text-foreground font-bold text-xl">
          {currentRank.tier} {currentRank.level}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <View className="flex flex-col gap-4">
          {nextRank && (
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <Text className="font-semibold text-xl text-muted-foreground">
                  Progress to {nextRank?.tier} {nextRank?.level}
                </Text>
              </View>
              <Text className="font-semibold text-primary text-2xl">
                {progressToNext * 100}%
              </Text>
            </View>
          )}
          <View className="flex flex-col gap-4">
            <Progress
              className="bg-primary/10"
              indicatorClassName="bg-primary"
              value={progressToNext * 100}
            />
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
