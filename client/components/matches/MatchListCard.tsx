import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { getMatch } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { TrendingDown } from "~/lib/icons/TrendingDown";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { ExtendedMatch } from "~/types/match";
import { getBadgeText, getBadgeVariant } from "~/utils/badgeUtils";
import { timeAgo } from "~/utils/dateUtils";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import LeagueLogo from "../ui/league-logos/LeagueLogo";
import ProfileImage from "../ui/profile-image";
import RankIcon from "../ui/rank-icon";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";

export default function MatchListCard({ matchId }: { matchId: number }) {
  const { data: match, isLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => await getMatch(matchId),
  });

  const { data: currentUserData } = authClient.useSession();

  if (isLoading || !match || !currentUserData?.user.id) {
    return <Card className="w-full animate-pulse h-[166px]" />;
  }

  const you = match.matchUsers.find(
    (matchUser) => matchUser.user.id == currentUserData.user.id
  );
  const opponent = match.matchUsers.find(
    (matchUser) => matchUser.user.id != currentUserData.user.id
  );

  if (!you || !opponent) {
    return null;
  }

  const badgeVariant = getBadgeVariant(
    you.status,
    you.balance,
    opponent.balance
  );

  const badgeText = getBadgeText(you.status, you.balance, opponent.balance);

  return (
    <Link
      className="w-full"
      href={{
        pathname: "/match/[matchId]",
        params: { matchId: match.id },
      }}
    >
      <Card className="w-full">
        <CardContent className="flex flex-col gap-3 p-4 items-start">
          <View className="flex flex-col gap-2">
            <View className="flex flex-row items-center justify-between w-full">
              <View className="flex flex-row items-center gap-1.5">
                <View className="flex flex-row items-center gap-2">
                  <LeagueLogo league={match.league} size={26} />
                  <Text className="text-lg uppercase font-bold">
                    {match.league}
                  </Text>
                </View>
                <Text className="font-semibold text-muted-foreground capitalize text-lg">
                  {match.type} Match
                </Text>
              </View>
              {match.type == "competitive" && (
                <RankIcon size={28} rank={you.rankSnapshot} />
              )}
            </View>
            <View className="flex flex-row items-center justify-between w-full">
              <View className="flex flex-row items-center gap-2">
                <Text className="text-muted-foreground font-semibold text-lg">
                  vs
                </Text>
                <ProfileImage
                  className="h-10 w-10"
                  image={opponent.user.image}
                  username={opponent.user.username}
                />
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
                <Text className="text-sm">{badgeText}</Text>
              </Badge>
              <View className="flex flex-row items-center gap-1">
                <Text className="font-bold text-2xl text-primary">
                  ${you.balance.toFixed(2)}
                </Text>
                <Text className="font-bold text-2xl">-</Text>
                <Text className="font-bold text-2xl">
                  ${opponent.balance.toFixed(2)}
                </Text>
              </View>
            </View>
            {match.resolved && match.type == "competitive" && (
              <View className="flex flex-row items-center gap-2">
                {you.pointsDelta > 0 && (
                  <TrendingUp className="text-primary" size={20} />
                )}
                {you.pointsDelta < 0 && (
                  <TrendingDown className="text-primary" size={20} />
                )}
                <Text className="font-bold text-2xl text-primary">
                  {you.pointsDelta >= 0 && "+ "}
                  {you.progressionDelta !== null
                    ? `${you.progressionDelta}%`
                    : `${you.pointsDelta} Points`}
                </Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </Link>
  );
}
