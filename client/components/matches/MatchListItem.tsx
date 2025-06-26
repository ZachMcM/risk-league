import { View } from "react-native";
import { MatchListEntity } from "~/types/matches";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Text } from "../ui/text";
import { cn, timeAgo } from "~/lib/utils";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { Badge } from "../ui/badge";
import InProgressBadge from "./InProgressBadge";

export default function MatchListItem({ match }: { match: MatchListEntity }) {
  return (
    <Card className="border-border/20 hover:bg-muted/20 transition-colors">
      <CardContent className="p-4">
        <View className="flex flex-row items-center justify-between">
          <View className="flex-row gap-4 items-center">
            <Text className="text-muted-foreground text-2xl font-bold">vs</Text>
            <View className="flex-row gap-3">
              <Avatar
                className="h-14 w-14 border border-primary/20"
                alt="Profile"
              >
                <AvatarImage
                  source={{
                    uri:
                      match.opponentImage ||
                      process.env.EXPO_PUBLIC_FALLBACK_IMAGE,
                  }}
                />
                <AvatarFallback>
                  <Text>RL</Text>
                </AvatarFallback>
              </Avatar>
              <View className="flex-col gap-1">
                <Text className="text-xl font-bold">
                  {match.opponentUsername}
                </Text>
                <View className="flex flex-row items-center gap-2">
                  <Text className="font-medium text-lg text-muted-foreground">
                    {timeAgo(match.createdAt)}
                  </Text>
                  {match.status == "in_progress" && (
                    <InProgressBadge
                      opponentBalance={match.opponentBalance}
                      balance={match.balance}
                    />
                  )}
                  <Text
                    className={cn(
                      match.balance == 100
                        ? "text-foreground"
                        : match.balance > 100
                        ? "text-green-600"
                        : "text-destructive",
                      "text-xl font-semibold"
                    )}
                  >
                    ${match.balance}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {match.status != "in_progress" && (
            <View className="flex flex-row gap-2">
              <TrendingUp
                size={18}
                className={cn(
                  match.eloDelta > 0 ? "text-green-600" : "text-red-600"
                )}
              />
              <Text
                className={cn(
                  match.eloDelta > 0 ? "text-green-600" : "text-red-600",
                  "text-xl font-medium"
                )}
              >
                {match.eloDelta}
              </Text>
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
}
