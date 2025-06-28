import { View } from "react-native";
import { Crown } from "~/lib/icons/Crown";
import { Shield } from "~/lib/icons/Shield";
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

interface Props {
  rankInfo: RankResponse;
}

export function RankProgress({ rankInfo }: Props) {
  const { currentRank, nextRank, progressToNext, eloRating } = rankInfo;

  return (
    <View className="flex flex-col gap-4 p-2  ">
      <View className="flex flex-col gap-4">
        {nextRank && (
          <View className="flex flex-row items-center gap-2.5">
            <Text className="text-primary font-geist-extrabold text-4xl">
              {progressToNext * 100}%
            </Text>
            <Text className="font-geist-bold text-lg">
              Progress to {nextRank.tier} {nextRank.level}
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
        <View className="flex flex-row justify-between items-center">
          <View className="flex flex-row gap-1 items-center">
            <Shield size={14} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground font-geist-medium">0%</Text>
          </View>
          <View className="flex flex-row gap-1 items-center">
            <Crown size={14} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground font-geist-medium">100%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
