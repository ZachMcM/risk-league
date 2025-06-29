import { View } from "react-native";
import { cn } from "~/lib/utils";
import { CurrentStatus, UserStats } from "~/types/matches";
import { Card, CardContent } from "../ui/card";
import { Text } from "../ui/text";
import { Badge } from "../ui/badge";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { TrendingDown } from "~/lib/icons/TrendingDown";
import { startingBalance } from "~/lib/constants";
import { useSession } from "../providers/SessionProvider";

export default function MatchStatsCard({
  userStats,
  status,
}: {
  userStats: UserStats;
  status: CurrentStatus;
}) {
  const { session } = useSession();

  const currentUser = session?.user.id == userStats.userId;

  return (
    <Card className={cn(currentUser && "border-primary/20 bg-primary/10")}>
      <CardContent className="p-6 flex flex-col gap-4">
        <View className="flex flex-row items-center justify-between">
          <Text
            className={cn(
              currentUser && "text-primary",
              "text-xl font-geist-bold"
            )}
          >
            {!currentUser ? userStats.username : "Your Performance"}
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
                currentUser && "text-primary",
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
            <Text className="font-geist-bold text-3xl">
              {userStats.totalParlays}
            </Text>
            <Text className="font-geist-semibold text-muted-foreground">
              Parlays
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
                    : userStats.balance < startingBalance && "text-destructive",
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
      </CardContent>
    </Card>
  );
}
