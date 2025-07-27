import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { TrendingDown } from "~/lib/icons/TrendingDown";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { Match } from "~/types/matches";
import { useSession } from "../providers/SessionProvider";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import Pfp from "../ui/pfp";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";
import { getLeagueEmoji } from "~/lib/utils";

export default function MatchListCard({ match }: { match: Match }) {
  const router = useRouter();

  const { session } = useSession();
  const you = match.matchUsers.find(
    (matchUser) => matchUser.user.id == session?.user.id
  )!;
  const opponent = match.matchUsers.find(
    (matchUser) => matchUser.user.id != session?.user.id
  )!;

  const badgeVariant =
    you.status == "not_resolved"
      ? you.balance > opponent.balance
        ? "success"
        : you.balance < opponent.balance
        ? "destructive"
        : "secondary"
      : you.status == "win"
      ? "success"
      : you.status == "loss" || you.status == "disqualified"
      ? "destructive"
      : "secondary";

  const badgeText =
    you.status == "not_resolved"
      ? you.balance > opponent.balance
        ? "Winning"
        : you.balance < opponent.balance
        ? "Losing"
        : "Tied"
      : you.status == "win"
      ? "Win"
      : you.status == "loss"
      ? "Loss"
      : you.status == "disqualified"
      ? "Disqualified"
      : "Tied";

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/(tabs)/matches/[matchId]",
          params: { matchId: match.id },
        })
      }
    >
      <Card>
        <CardContent className="flex flex-col gap-6 p-4">
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-4">
              <Pfp
                image={opponent.user.image}
                username={opponent.user.username}
              />
              <View className="flex flex-col gap-2">
                <View className="flex flex-row items-center gap-2">
                  <Text className="font-semibold text-muted-foreground text-lg">
                    vs
                  </Text>
                  <Text className="font-bold text-lg">
                    {opponent.user.username}
                  </Text>
                </View>
                <View className="flex flex-row items-center gap-2">
                  <Badge variant={badgeVariant} className="self-start">
                    <Text className="text-sm">{badgeText}</Text>
                  </Badge>
                  <Badge variant="secondary" className="self-start rounded-lg">
                    <Text className="uppercase text-sm">{match.gameMode}</Text>
                  </Badge>
                </View>
              </View>
            </View>
            {!match.resolved ? (
              <View className="p-4 flex flex-row h-full gap-4 items-center">
                <View className="flex flex-col items-center">
                  <Text className="text-xl font-bold text-primary">
                    ${you.balance}
                  </Text>
                  <Text className="font-semibold text-muted-foreground text-sm">
                    You
                  </Text>
                </View>
                <Separator orientation="vertical" />
                <View className="flex flex-col items-center">
                  <Text className="text-xl font-bold">${opponent.balance}</Text>
                  <Text className="font-semibold text-muted-foreground text-sm">
                    Opponent
                  </Text>
                </View>
              </View>
            ) : (
              <View className="flex flex-col gap-1 items-center">
                <View className="flex flex-row items-center gap-2 px-2 py-0.5 rounded-lg bg-primary/10">
                  {you.eloDelta > 0 ? (
                    <TrendingUp className="text-primary" size={20} />
                  ) : (
                    <TrendingDown className="text-primary" size={20} />
                  )}
                  <Text className="font-bold text-xl text-primary">
                    {you.eloDelta}
                  </Text>
                </View>
                <Text className="text-muted-foreground font-medium text-sm">
                  Rating Change
                </Text>
              </View>
            )}
          </View>
          {!match.resolved && (
            <View className="flex flex-row justify-center items-center border-t border-border pt-4">
              <View className="flex flex-row items-center gap-2 text-xs text-blue-600">
                <View className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <Text className="font-medium">Match in progress 🔥</Text>
              </View>
            </View>
          )}
        </CardContent>
      </Card>
    </Pressable>
  );
}
