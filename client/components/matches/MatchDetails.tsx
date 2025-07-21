import { View } from "react-native";
import { startingBalance } from "~/lib/constants";
import { TrendingDown } from "~/lib/icons/TrendingDown";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { cn } from "~/lib/utils";
import { Match, MatchUser } from "~/types/matches";
import { useSession } from "../providers/SessionProvider";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import Pfp from "../ui/pfp";
import { Text } from "../ui/text";

export default function MatchDetails({ match }: { match: Match }) {
  const { session } = useSession();
  const currentUser = session?.user.id == match.matchUsers[0].user.id ? 0 : 1;
  const otherUser = currentUser == 0 ? 1 : 0;

  const currentUserStatus =
    match.matchUsers[currentUser].balance > match.matchUsers[otherUser].balance
      ? "winning"
      : match.matchUsers[currentUser].balance ==
        match.matchUsers[otherUser].balance
      ? "tied"
      : "losing";

  const otherUserStatus =
    currentUserStatus == "losing"
      ? "winning"
      : currentUserStatus == "tied"
      ? "tied"
      : "losing";

  return (
    <View className="flex flex-col gap-4 items-center">
      <MatchUserCard
        matchUser={match.matchUsers[currentUser]}
        currentUser={true}
        status={currentUserStatus}
      />
      <View className="rounded-full h-12 w-12 bg-primary flex justify-center items-center">
        <Text className="font-bold text-2xl text-white">vs</Text>
      </View>
      <MatchUserCard
        matchUser={match.matchUsers[otherUser]}
        currentUser={false}
        status={otherUserStatus}
      />
    </View>
  );
}

function MatchUserCard({
  matchUser,
  currentUser,
  status,
}: {
  matchUser: MatchUser;
  currentUser: boolean;
  status: "winning" | "losing" | "tied";
}) {
  const percentIncrease =
    ((matchUser.balance - startingBalance) / startingBalance) * 100;

  const totalParlays =
    matchUser.parlaysWon + matchUser.parlaysLost + matchUser.parlaysInProgress;

  return (
    <Card className="w-full">
      <CardContent className="p-6 flex flex-col gap-4">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-4">
            <Pfp
              image={matchUser.user.image}
              username={matchUser.user.username}
            />
            <View className="flex flex-col">
              <Text className="font-extrabold text-lg">
                {currentUser ? "You" : "Opponent"}
              </Text>
              <Text className="font-medium text-xl">
                {matchUser.user.username}
              </Text>
            </View>
          </View>
          <Badge
            variant={
              status == "winning"
                ? "success"
                : status == "losing"
                ? "destructive"
                : "secondary"
            }
          >
            <Text className="text-base capitalize">{status}</Text>
          </Badge>
        </View>
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-col items-center">
            <Text
              className={cn(
                "font-bold text-2xl",
                status == "winning" && "text-success",
                status == "losing" && "text-destructive"
              )}
            >
              ${matchUser.balance.toFixed(2)}
            </Text>
            <Text className="font-medium text-muted-foreground">Balance</Text>
          </View>
          <View className="flex flex-col items-center">
            <Text className="font-bold text-2xl">
              ${matchUser.potentialPayout.toFixed(2)}
            </Text>
            <Text className="font-medium text-muted-foreground">
              Potential Payout
            </Text>
          </View>
          <View className="flex flex-col items-center">
            <View className="flex flex-row gap-2 items-center">
              {percentIncrease > 0 && (
                <TrendingUp
                  className={cn(
                    percentIncrease > 0 && "text-success",
                    percentIncrease < 0 && "text-destructive"
                  )}
                />
              )}
              {percentIncrease > 0 && (
                <TrendingDown
                  className={cn(
                    percentIncrease > 0 && "text-success",
                    percentIncrease < 0 && "text-destructive"
                  )}
                />
              )}
              <Text
                className={cn(
                  "font-bold text-2xl",
                  percentIncrease > 0 && "text-success",
                  percentIncrease < 0 && "text-destructive"
                )}
              >
                {percentIncrease.toFixed(2)}%
              </Text>
            </View>
            <Text className="font-medium text-muted-foreground">Change</Text>
          </View>
        </View>
        <View className="flex flex-row justify-between items-center pt-4 border-t border-border/50">
          <View className="flex flex-col items-center">
            <Text className="font-bold text-2xl">{matchUser.parlaysWon}</Text>
            <Text className="text-sm font-medium text-muted-foreground">
              Wins
            </Text>
          </View>
          <View className="flex flex-col items-center">
            <Text className="font-bold text-2xl">{matchUser.parlaysLost}</Text>
            <Text className="text-sm font-medium text-muted-foreground">
              Losses
            </Text>
          </View>
          <View className="flex flex-col items-center">
            <Text className="font-bold text-2xl">
              {matchUser.parlaysInProgress}
            </Text>
            <Text className="text-sm font-medium text-muted-foreground">
              In Progress
            </Text>
          </View>
          <View className="flex flex-col items-center">
            <Text className="font-bold text-2xl">{totalParlays}</Text>
            <Text className="text-sm font-medium text-muted-foreground">
              Total
            </Text>
          </View>
          <View className="flex flex-col items-center">
            <Text className="font-bold text-2xl">
              {totalParlays == 0 ? 0 : matchUser.parlaysWon / totalParlays}%
            </Text>
            <Text className="text-sm font-medium text-muted-foreground">
              Win Rate
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
