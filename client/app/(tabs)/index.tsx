import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { View } from "react-native";
import { useSession } from "~/components/providers/SessionProvider";
import Pfp from "~/components/ui/pfp";
import RankBadge from "~/components/ui/RankBadge";
import RankIcon from "~/components/ui/RankIcon";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import { getActiveLeagues, getUser } from "~/endpoints";
import { getRank } from "~/lib/utils";
import { Trophy } from "~/lib/icons/Trophy";
import { Progress } from "~/components/ui/progress";
import { RankText } from "~/components/ui/rank-text";

export default function Home() {
  const { session } = useSession();

  if (!session) return;

  const { data: user, isPending: isUserPending } = useQuery({
    queryKey: ["user", session.user.id],
    queryFn: async () => await getUser(session?.user.id!),
  });

  const { data: activeLeagues, isPending: isActiveLeaguesPending } = useQuery({
    queryKey: ["active-leagues"],
    queryFn: getActiveLeagues,
  });

  const rank = getRank(user?.eloRating!);

  return (
    <ScrollContainer className="px-0 pt-0" safeAreaInsets>
      <View className="relative w-full">
        <View className="relative overflow-hidden h-48">
          {session.user.header ? (
            <View className="w-full h-full bg-primary" />
          ) : (
            <Image
              contentFit="cover"
              source={session.user.header}
              style={{ width: "100%", height: "100%" }}
              className="bg-primary"
            />
          )}
        </View>
        <View className="absolute -bottom-16 left-4">
          <Pfp
            className="w-32 h-32 border-4 border-background"
            image={session.user.image}
            username={session.user.username}
          />
        </View>
      </View>
      <View className="flex flex-1 flex-col gap-6 px-4 pt-20">
        <View className="flex flex-col gap-4 items-start">
          <View className="flex flex-col gap-1">
            <Text className="font-bold text-2xl">{session.user.username}</Text>
            <View className="flex flex-row items-center gap-2">
              <View className="flex flex-row items-center gap-1">
                <Text className="text-primary font-bold text-xl">
                  {rank.eloRating}
                </Text>
                <Text className="text-muted-foreground text-xl">points</Text>
              </View>
              <Trophy className="text-muted-foreground" size={18} />
            </View>
          </View>
          <RankBadge
            showIcon
            level={rank.currentRank.level}
            tier={rank.currentRank.tier}
          />
        </View>
        {rank.nextRank && (
          <View className="flex flex-col gap-2">
            <View className="flex flex-row items-center justify-between">
              <Text className="font-semibold text-muted-foreground text-lg">
                Progress to rank
              </Text>
              <Text className="font-semibold text-primary text-lg">
                {rank.progressToNext}%
              </Text>
            </View>
            <Progress value={rank.progressToNext * 100} variant="primary" />
            <View className="flex flex-row items-center justify-between w-full">
              <Text className="font-semibold text-muted-foreground flex-1 text-left">
                {rank.currentRank.minElo}
              </Text>
              <RankText tier={rank.nextRank.tier} className="flex-1 text-center">
                {rank.nextRank.tier} {rank.nextRank.level}
              </RankText>
              <Text className="font-semibold text-muted-foreground flex-1 text-right">
                {rank.nextRank.minElo}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollContainer>
  );
}
