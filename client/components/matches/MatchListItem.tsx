import { Pressable, View } from "react-native";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { cn, timeAgo } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent } from "../ui/card";
import { Text } from "../ui/text";
import { Badge } from "../ui/badge";
import { useRouter } from "expo-router";
import { MatchListEntity } from "~/types/matches";
import Pfp from "../ui/pfp";

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
              <Text className="text-muted-foreground text-2xl font-geist-bold">
                vs
              </Text>
              <View className="flex-row gap-3">
                <Pfp
                  username={match.opponentUsername}
                  image={match.opponentImage}
                />
                <View className="flex flex-col gap-1">
                  <View className="flex flex-row gap-4">
                    <Text className="text-xl font-geist-bold">
                      {match.opponentUsername}
                    </Text>
                    {match.status == "in_progress" && (
                      <Badge
                        variant={
                          match.opponentBalance > match.balance
                            ? "destructive"
                            : match.opponentBalance == match.balance
                            ? "secondary"
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
                    <Text className="font-geist-medium text-muted-foreground">
                      {timeAgo(match.createdAt)}
                    </Text>
                    {match.status != "in_progress" ? (
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
                            "font-geist-medium"
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
                          "font-geist-medium"
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
