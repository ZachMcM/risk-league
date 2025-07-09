import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { cn, timeAgo } from "~/lib/utils";
import { MatchListEntity } from "~/types/matches";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import Pfp from "../ui/pfp";
import { Text } from "../ui/text";
import { Clock } from "~/lib/icons/Clock";

export default function MatchListItem({ match }: { match: MatchListEntity }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(tabs)/matches/[id]",
          params: { id: match.id },
        })
      }
    >
      <Card>
        <CardContent className="p-4">
          <View className="flex flex-row items-center justify-between">
            <View className="flex-row gap-4 items-center">
              <Text className="text-muted-foreground text-2xl font-bold">
                vs
              </Text>
              <View className="flex-row gap-3">
                <View className="relative">
                  <Pfp
                    username={match.opponentUsername}
                    image={match.opponentImage}
                  />
                  <View className="h-3 w-3 border border-border bg-blue-500 absolute bottom-0 right-0 rounded-full animate-pulse">
                    <View className="w-full h-full bg-blue-400 rounded-full animate-ping" />
                  </View>
                </View>
                <View className="flex flex-col gap-1">
                  <View className="flex flex-row gap-4">
                    <Text className="text-xl font-bold">
                      {match.opponentUsername}
                    </Text>
                    {match.status == "not_resolved" && (
                      <Badge
                        variant={
                          match.opponentBalance > match.balance
                            ? "destructive"
                            : match.opponentBalance == match.balance
                            ? "outline"
                            : "success"
                        }
                      >
                        <Text className="text-sm">
                          {match.opponentBalance > match.balance
                            ? "Losing"
                            : match.opponentBalance == match.balance
                            ? "Tied"
                            : "Winning"}
                        </Text>
                      </Badge>
                    )}
                  </View>
                  <View className="flex flex-row items-center gap-4">
                    <View className="flex flex-row items-center gap-1.5">
                      <Clock size={14} className="text-muted-foreground" />
                      <Text className="font-medium text-muted-foreground">
                        {timeAgo(match.createdAt)}
                      </Text>
                    </View>
                    {match.status != "not_resolved" ? (
                      <View className="flex flex-row gap-2">
                        <TrendingUp
                          size={18}
                          className={cn(
                            match.eloDelta > 0
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        />
                        <Text
                          className={cn(
                            match.eloDelta > 0
                              ? "text-green-600"
                              : "text-red-600",
                            "font-medium"
                          )}
                        >
                          {match.eloDelta}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        className={cn(
                          match.balance == 100
                            ? "text-foreground"
                            : match.balance > 100
                            ? "text-green-600"
                            : "text-destructive",
                          "font-medium"
                        )}
                      >
                        ${match.balance}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}
