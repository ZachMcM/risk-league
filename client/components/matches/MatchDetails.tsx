import { View } from "react-native";
import { getBadgeText, getBadgeVariant, getRank } from "~/lib/utils";
import { Match, MatchUser } from "~/types/matches";
import { useSession } from "../providers/SessionProvider";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import ProfileImage from "../ui/profile-image";
import RankIcon from "../ui/RankIcon";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";

export default function MatchDetails({ match }: { match: Match }) {
  const { session } = useSession();
  const currentUser = session?.user.id == match.matchUsers[0].user.id ? 0 : 1;
  const otherUser = currentUser == 0 ? 1 : 0;

  return (
    <Card>
      <CardContent className="px-4 py-6 flex flex-col gap-6">
        <MatchUserItem
          matchUser={match.matchUsers[currentUser]}
          currentUser={true}
          otherUserBalance={match.matchUsers[otherUser].balance}
        />
        <Separator />
        <MatchUserItem
          matchUser={match.matchUsers[otherUser]}
          currentUser={false}
          otherUserBalance={match.matchUsers[currentUser].balance}
        />
      </CardContent>
    </Card>
  );
}

function MatchUserItem({
  matchUser,
  currentUser,
  otherUserBalance,
}: {
  matchUser: MatchUser;
  currentUser: boolean;
  otherUserBalance: number;
}) {
  const totalParlays =
    matchUser.parlaysWon + matchUser.parlaysLost + matchUser.parlaysInProgress;

  const badgeVariant = getBadgeVariant(
    matchUser.status,
    matchUser.balance,
    otherUserBalance
  );
  const badgeText = getBadgeText(
    matchUser.status,
    matchUser.balance,
    otherUserBalance
  );

  return (
    <View className="flex flex-col gap-6">
      <View className="flex flex-row items-start justify-between">
        <View className="flex flex-row items-center gap-4">
          <ProfileImage
            image={matchUser.user.image}
            username={matchUser.user.username}
          />
          <View className="flex flex-col gap-1">
            <Text className="font-semibold text-muted-foreground text-lg">
              {currentUser ? "You" : "Opponent"}
            </Text>
            <View className="flex flex-row items-center gap-2">
              <RankIcon
                tier={getRank(matchUser.eloRatingSnapshot).currentRank.tier}
                iconClassName="h-4 w-4"
                gradientStyle={{
                  padding: 5
                }}
              />
              <Text className="font-bold text-xl">
                {matchUser.user.username}
              </Text>
            </View>
          </View>
        </View>
        <Badge className="px-3.5" variant={badgeVariant}>
          <Text className="text-lg capitalize">{badgeText}</Text>
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
