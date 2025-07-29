import { Link, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { TrendingDown } from "~/lib/icons/TrendingDown";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import {
  cn,
  getBadgeText,
  getBadgeVariant,
  getLeftBorderColor,
  getRank,
} from "~/lib/utils";
import { Match } from "~/types/matches";
import { useSession } from "../providers/SessionProvider";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import ProfileImage from "../ui/profile-image";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";
import RankBadge from "../ui/RankBadge";

export default function MatchListCard({ match }: { match: Match }) {
  const { session } = useSession();
  const you = match.matchUsers.find(
    (matchUser) => matchUser.user.id == session?.user.id
  )!;
  const opponent = match.matchUsers.find(
    (matchUser) => matchUser.user.id != session?.user.id
  )!;

  const badgeVariant = getBadgeVariant(
    you.status,
    you.balance,
    opponent.balance
  );

  const badgeText = getBadgeText(you.status, you.balance, opponent.balance);

  const borderLeftColor = getLeftBorderColor(
    you.status,
    you.balance,
    opponent.balance
  );

  return (
    <Link
      className="w-full"
      href={{
        pathname: "/(tabs)/matches/[matchId]",
        params: { matchId: match.id },
      }}
    >
      <Card className={cn("w-full", borderLeftColor)}>
        <CardContent className="flex flex-col gap-2 p-4">
          <View className="flex flex-row items-center gap-4">
            <Text className="text-muted-foreground font-semibold text-lg">vs</Text>
            <View className="flex flex-row items-center gap-4">
              <ProfileImage
                className="h-12 w-12"
                image={opponent.user.image}
                username={opponent.user.username}
              />
              <View className="flex flex-col gap-1 items-start">
                <RankBadge
                  textClassName="text-xs"
                  iconClassName="h-4 w-4"
                  gradientStyle={{
                    paddingHorizontal: 8,
                    gap: 4
                  }}
                  tier={getRank(opponent.user.eloRating).currentRank.tier}
                  level={getRank(opponent.user.eloRating).currentRank.level}
                  showIcon
                />
                <Text className="font-bold text-lg">{opponent.user.username}</Text>
              </View>
            </View>
          </View>
          <Separator />
        </CardContent>
      </Card>
    </Link>
  );
}
