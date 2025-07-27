import { View } from "react-native";
import { Match, MatchUser } from "~/types/matches";
import { useSession } from "../providers/SessionProvider";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import Pfp from "../ui/pfp";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";
import { getLeagueEmoji } from "~/lib/utils";

export default function MatchDetails({ match }: { match: Match }) {
  const { session } = useSession();
  const currentUser = session?.user.id == match.matchUsers[0].user.id ? 0 : 1;
  const otherUser = currentUser == 0 ? 1 : 0;

  const currentUserStatus = !match.resolved
    ? match.matchUsers[currentUser].balance >
      match.matchUsers[otherUser].balance
      ? "winning"
      : match.matchUsers[currentUser].balance ==
        match.matchUsers[otherUser].balance
      ? "tied"
      : "losing"
    : match.matchUsers[currentUser].status;

  const otherUserStatus = !match.resolved
    ? currentUserStatus == "losing"
      ? "winning"
      : currentUserStatus == "tied"
      ? "tied"
      : "losing"
    : match.matchUsers[otherUser].status;

  return (
    <Card>
      <CardContent className="px-4 py-6 flex flex-col gap-6">
        <MatchUserItem
          matchUser={match.matchUsers[currentUser]}
          currentUser={true}
          status={currentUserStatus}
        />
        <Separator />
        <MatchUserItem
          matchUser={match.matchUsers[otherUser]}
          currentUser={false}
          status={otherUserStatus}
        />
      </CardContent>
    </Card>
  );
}

function MatchUserItem({
  matchUser,
  currentUser,
  status,
}: {
  matchUser: MatchUser;
  currentUser: boolean;
  status: string;
}) {
  const totalParlays =
    matchUser.parlaysWon + matchUser.parlaysLost + matchUser.parlaysInProgress;

  return (
    <View className="flex flex-col gap-6">
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
            status == "winning" || status == "win"
              ? "success"
              : status == "losing" || "loss"
              ? "destructive"
              : "secondary"
          }
        >
          <Text className="text-base capitalize">{status}</Text>
        </Badge>
      </View>
      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-col items-center flex-1 w-full">
          <Text className="font-bold text-2xl">
            ${matchUser.balance.toFixed(2)}
          </Text>
          <Text className="font-medium text-muted-foreground text-sm">
            Balance
          </Text>
        </View>
        <View className="flex flex-col items-center flex-1 w-full">
          <Text className="font-bold text-2xl">
            ${matchUser.potentialPayout.toFixed(2)}
          </Text>
          <Text className="font-medium text-muted-foreground text-sm">
            Potential Payout
          </Text>
        </View>
        <View className="flex flex-col items-center flex-1 w-full">
          <Text className="font-bold text-2xl">
            {totalParlays == 0 ? 0 : matchUser.parlaysWon / totalParlays}%
          </Text>
          <Text className="font-medium text-muted-foreground text-sm">
            Parlay Win Rate
          </Text>
        </View>
      </View>
    </View>
  );
}
