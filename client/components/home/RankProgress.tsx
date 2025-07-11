import { View } from "react-native";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { cn, rankForeground } from "~/lib/utils";
import { RankInfo } from "~/types/ranks";
import RankIcon from "../ui/RankIcon";
import { Card, CardContent } from "../ui/card";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";
import RankBadge from "../ui/RankBadge";

export function RankProgress({ rank }: { rank: RankInfo }) {
  if (!rank.nextRank) {
    return;
  }

  return (
    <Card>
      <CardContent className="p-6 flex flex-col gap-6">
        <View className="flex flex-col gap-4">
          <View className="flex flex-row justify-center items-center gap-3">
            <TrendingUp className="text-primary" size={24} />
            <Text className="text-primary font-extrabold text-4xl">
              {rank.progressToNext * 100}%
            </Text>
          </View>
          <Progress
            className="bg-primary/10 h-5"
            indicatorClassName="bg-primary"
            value={rank.progressToNext * 100}
          />
          <View className="flex flex-row gap-4 items-center justify-center">
            <Text className="font-medium text-lg text-muted-foreground">
              Next Rank
            </Text>
            <RankBadge tier={rank.nextRank.tier} level={rank.nextRank.level}/>
          </View>
        </View>
        <View className="flex flex-col items-center pt-6 border-t border-border/50">
          <Text className="font-bold text-2xl">{rank.pointsToNext}</Text>
          <View className="flex flex-row items-center gap-2">
            <Text className="text-muted-foreground font-medium">
              points to reach
            </Text>
            <Text
              className={cn(
                "font-bold text-lg",
                rankForeground(rank.nextRank.tier)
              )}
            >
              {rank.nextRank.tier} {rank.nextRank.level}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
