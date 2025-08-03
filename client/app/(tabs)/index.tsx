import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { View } from "react-native";
import StartMatch from "~/components/matches/StartMatch";
import ProfileImage from "~/components/ui/profile-image";
import { Progress } from "~/components/ui/progress";
import { RankText } from "~/components/ui/rank-text";
import RankBadge from "~/components/ui/RankBadge";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Skeleton } from "~/components/ui/skeleton";
import { Text } from "~/components/ui/text";
import { getUser } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { getRank } from "~/lib/utils";

export default function Home() {
  const { data } = authClient.useSession();

  const { data: user } = useQuery({
    queryKey: ["user", data?.user.id],
    queryFn: async () => await getUser(data?.user.id!),
  });

  const rank = !user ? undefined : getRank(user?.peakPoints);

  return (
    <ScrollContainer className="px-0 pt-0" safeAreaInsets>
      <View className="relative w-full">
        <View className="relative overflow-hidden h-48">
          {data?.user.header ? (
            <View className="w-full h-full bg-primary" />
          ) : (
            <Image
              contentFit="cover"
              source={data?.user.header}
              style={{ width: "100%", height: "100%" }}
              className="bg-primary"
            />
          )}
        </View>
        <View className="absolute -bottom-16 left-4 p-2 bg-background rounded-lg">
          <ProfileImage
            className="w-32 h-32"
            image={data?.user.image!}
            username={data?.user.username!}
          />
        </View>
      </View>
      <View className="flex flex-1 flex-col gap-6 px-4 pt-20">
        <View className="flex flex-col gap-4 items-start">
          <View className="flex flex-col gap-1">
            <Text className="font-bold text-2xl">{data?.user.username}</Text>
            <View className="flex flex-row items-center gap-2">
              <View className="flex flex-row items-center gap-1">
                {!rank ? (
                  <Skeleton />
                ) : (
                  <Text className="text-primary font-bold text-xl">
                    {rank.points}
                  </Text>
                )}
                <Text className="text-muted-foreground text-xl">points</Text>
              </View>
            </View>
          </View>
          {!rank ? (
            <Skeleton />
          ) : (
            <RankBadge
              showIcon
              level={rank.currentRank.level}
              tier={rank.currentRank.tier}
            />
          )}
        </View>
        {!rank ? (
          <Skeleton />
        ) : (
          rank.nextRank && (
            <View className="flex flex-col gap-2">
              <View className="flex flex-row items-center justify-between">
                <Text className="font-semibold text-muted-foreground text-lg">
                  Progress to rank
                </Text>
                <Text className="font-semibold text-primary text-lg">
                  {Math.round(rank.progressToNext * 100)}%
                </Text>
              </View>
              <Progress value={rank.progressToNext * 100} variant="primary" />
              <View className="flex flex-row items-center justify-between w-full">
                <Text className="font-semibold text-muted-foreground flex-1 text-left">
                  {rank.currentRank.minPoints}
                </Text>
                <RankText
                  tier={rank.nextRank.tier}
                  className="flex-1 text-center"
                >
                  {rank.nextRank.tier} {rank.nextRank.level}
                </RankText>
                <Text className="font-semibold text-muted-foreground flex-1 text-right">
                  {rank.nextRank.maxPoints}
                </Text>
              </View>
            </View>
          )
        )}
        <StartMatch />
      </View>
    </ScrollContainer>
  );
}
