import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Match } from "~/types/matches";
import { Card, CardContent } from "../ui/card";
import Pfp from "../ui/pfp";
import { useSession } from "../providers/SessionProvider";
import { Text } from "../ui/text";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Flame } from "~/lib/icons/Flame";

export default function MatchListItem({ match }: { match: Match }) {
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
        router.push({
          pathname: "/(tabs)/matches/[id]",
          params: { id: match.id },
        })
      }
    >
      <Card>
        <CardContent className="flex flex-col gap-6 p-4">
          <View className="flex flex-row items-center gap-4">
            <Pfp
              image={opponent.user.image}
              username={opponent.user.username}
            />
            <View className="flex flex-col gap-1 items-start">
              <View className="flex flex-row items-center gap-2">
                <Text className="font-semibold text-muted-foreground text-xl">
                  vs
                </Text>
                <Text className="font-bold text-xl">
                  {opponent?.user.username}
                </Text>
              </View>
              <View className="flex flex-row items-center gap-6">
                <Badge variant={badgeVariant}>
                  <Text className="text-base px-1 py-0.5">{badgeText}</Text>
                </Badge>
                <View className="flex flex-col items-center">
                  <Text className="text-primary font-bold text-lg">
                    ${you.balance}
                  </Text>
                  <Text className="text-muted-foreground font-semibold">
                    You
                  </Text>
                </View>
                <Text className="font-bold text-muted-foreground text-lg">
                  :
                </Text>
                <View className="flex flex-col items-center">
                  <Text className="font-bold text-lg">
                    ${opponent.balance}
                  </Text>
                  <Text className="text-muted-foreground font-semibold">
                    Opponent
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {!match.resolved && (
            <View className="flex flex-row justify-center items-center border-t border-border/50 pt-4">
              <View className="flex flex-row items-center gap-2 text-xs text-blue-600">
                <View className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <Text className="font-medium">Match in progress</Text>
                <Flame className="text-orange-400" size={16} />
              </View>
            </View>
          )}
        </CardContent>
      </Card>
    </Pressable>
  );
}
