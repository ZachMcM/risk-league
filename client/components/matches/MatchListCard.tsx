import { Link } from "expo-router";
import { View } from "react-native";
import { TrendingDown } from "~/lib/icons/TrendingDown";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { Trophy } from "~/lib/icons/Trophy";
import {
  cn,
  getBadgeText,
  getBadgeVariant,
  getLeftBorderColor,
  getRank,
  timeAgo,
} from "~/lib/utils";
import { Match } from "~/types/matches";
import { useSession } from "../providers/SessionProvider";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import RankBadge from "../ui/RankBadge";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";
import ProfileImage from "../ui/profile-image";

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
        <CardContent className="flex flex-col gap-3 p-4 items-start">
          <View className="flex flex-col gap-2">
            <View className="flex flex-row items-center justify-between w-full">
              <View className="flex-1 items-start">
                <Text className="font-semibold text-muted-foreground capitalize">
                  {match.type}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Badge variant="secondary" className="px-3.5">
                  <Text className="text-base uppercase">{match.league}</Text>
                </Badge>
              </View>
              <View className="flex-1 items-end">
                {match.type == "competitive" && (
                  <RankBadge
                    showIcon
                    iconClassName="h-4 w-4"
                    textClassName="text-sm"
                    gradientStyle={{
                      paddingHorizontal: 10,
                      gap: 4,
                    }}
                    tier={getRank(you.eloRatingSnapshot).currentRank.tier}
                    level={getRank(you.eloRatingSnapshot).currentRank.level}
                  />
                )}
              </View>
            </View>
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-1">
                <Text className="text-muted-foreground font-semibold text-lg">
                  vs
                </Text>
                <Text className="text-lg font-bold">
                  {opponent.user.username}
                </Text>
              </View>
              <Text className="text-muted-foreground">
                {timeAgo(match.createdAt)}
              </Text>
            </View>
          </View>
          <Separator />
          <View className="flex flex-row items-end justify-between w-full">
            <View className="flex flex-col gap-2 items-start">
              <Badge className="px-3.5" variant={badgeVariant}>
                <Text className="text-base">{badgeText}</Text>
              </Badge>
              <View className="flex flex-row items-center gap-1">
                <Text className="font-bold text-3xl text-primary">
                  ${you.balance}
                </Text>
                <Text className="font-bold text-3xl">-</Text>
                <Text className="font-bold text-3xl">${opponent.balance}</Text>
              </View>
            </View>
            {match.resolved && (
              <View className="flex flex-row gap-1 items-center">
                <View className="flex flex-row items-center gap-2 px-2 py-0.5 rounded-lg bg-primary/10">
                  {you.eloDelta > 0 ? (
                    <TrendingUp className="text-primary" size={20} />
                  ) : (
                    <TrendingDown className="text-primary" size={20} />
                  )}
                  <Text className="font-bold text-xl text-primary">
                    {you.eloDelta > 0 && "+"}
                    {you.eloDelta} points
                  </Text>
                </View>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </Link>
  );
}
