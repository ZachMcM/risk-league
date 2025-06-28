import { View } from "react-native";
import { cn } from "~/lib/utils";
import { CurrentStatus, UserStats } from "~/types/matches";
import { Card, CardContent } from "../ui/card";
import { Text } from "../ui/text";
import { Badge } from "../ui/badge";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { TrendingDown } from "~/lib/icons/TrendingDown";
import { startingBalance } from "~/lib/constants";

interface Props {
  userStats: UserStats;
  status: CurrentStatus;
  opponent?: boolean;
}

export default function MatchStatsCard({ userStats, status, opponent }: Props) {
  return (
    <Card className={cn(!opponent && "border-primary/20 bg-primary/10")}>
      <CardContent className="p-4">
        <View className="flex flex-col gap-4">
          <View className="flex flex-row items-center justify-between">
            <Text
              className={cn(!opponent && "text-primary", "text-xl font-geist-bold")}
            >
              {opponent ? userStats.username : "Your Performance"}
            </Text>
            <Badge
              variant={
                status == "tied"
                  ? "secondary"
                  : status == "winning"
                  ? "success"
                  : "destructive"
              }
            >
              <Text className="text-base capitalize">{status}</Text>
            </Badge>
          </View>
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-col items-center">
              <Text
                className={cn(
                  !opponent && "text-primary",
                  "text-3xl font-geist-bold"
                )}
              >
                ${userStats.balance.toPrecision(5)}
              </Text>
              <Text className="font-geist-semibold text-muted-foreground">
                Current Balance
              </Text>
            </View>
            <View className="flex flex-col items-center">
              <View className="flex flex-row items-center gap-2">
                {userStats.balance > startingBalance ? (
                  <TrendingUp size={24} className="text-success" />
                ) : (
                  userStats.balance < startingBalance && (
                    <TrendingDown size={24} className="text-destructive" />
                  )
                )}
                <Text
                  className={cn(
                    userStats.balance > startingBalance
                      ? "text-success"
                      : userStats.balance < startingBalance &&
                          "text-destructive",
                    "font-geist-bold text-3xl"
                  )}
                >
                  {Math.abs(startingBalance - userStats.balance)}
                </Text>
              </View>
              <Text className="font-geist-semibold text-muted-foreground">
                Change
              </Text>
            </View>
          </View>
          <View className="w-full h-[1px] bg-secondary"/>
          <View className="self-center flex flex-row gap-8 items-center">
            <View className="flex flex-col items-center">
              <Text className="font-geist-semibold text-2xl text-success">
                {userStats.parlaysWon}
              </Text>
              <Text className="font-geist-semibold text-base text-muted-foreground">
                Wins
              </Text>
            </View>
            <View className="flex flex-col items-center">
              <Text className="font-geist-semibold text-2xl text-destructive">
                {userStats.parlaysLost}
              </Text>
              <Text className="font-geist-semibold text-base text-muted-foreground">
                Losses
              </Text>
            </View>
            <View className="flex flex-col items-center">
              <Text className="font-geist-semibold text-2xl">
                {userStats.parlaysInProgress}
              </Text>
              <Text className="font-geist-semibold text-base text-muted-foreground">
                In Progress
              </Text>
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
