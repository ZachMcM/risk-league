import { View } from "react-native";
import { startingBalance } from "~/lib/constants";
import { TrendingDown } from "~/lib/icons/TrendingDown";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { cn } from "~/lib/utils";
import { CurrentStatus, UserStats } from "~/types/matches";
import { useSession } from "../providers/SessionProvider";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Text } from "../ui/text";

export default function MatchStatsCard({ stats }: { stats: UserStats }) {
  const { session } = useSession()
  const opponent = session?.user.id != stats.userId

  return (
    <Card className={cn(!opponent && "border-primary/20 bg-primary/10")}>
      <CardContent className="p-6 flex flex-col gap-4">
        <View className="flex flex-row items-center justify-between">
          <Text
            className={cn(
              !opponent && "text-primary",
              "text-xl font-bold"
            )}
          >
            {opponent ? stats.username : "Your Performance"}
          </Text>
        </View>
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-col items-center">
            <Text
              className={cn(
                !opponent && "text-primary",
                "text-3xl font-bold"
              )}
            >
              ${stats.balance.toPrecision(5)}
            </Text>
            <Text className="font-semibold text-muted-foreground">
              Current Balance
            </Text>
          </View>
          <View className="flex flex-col items-center">
            <Text className="font-bold text-3xl">
              {stats?.totalParlays}
            </Text>
            <Text className="font-semibold text-muted-foreground">
              Parlays
            </Text>
          </View>
          <View className="flex flex-col items-center">
            <View className="flex flex-row items-center gap-2">
              {stats.balance > startingBalance ? (
                <TrendingUp size={24} className="text-success" />
              ) : (
                stats.balance < startingBalance && (
                  <TrendingDown size={24} className="text-destructive" />
                )
              )}
              <Text
                className={cn(
                  stats?.balance > startingBalance
                    ? "text-success"
                    : stats?.balance < startingBalance && "text-destructive",
                  "font-bold text-3xl"
                )}
              >
                {Math.abs(startingBalance - stats.balance)}
              </Text>
            </View>
            <Text className="font-semibold text-muted-foreground">
              Change
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
