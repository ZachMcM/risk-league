import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { View } from "react-native";
import MatchmakingDialog from "~/components/matches/MatchmakingDialog";
import StartMatchCard from "~/components/matches/StartMatchCard";
import { Button } from "~/components/ui/button";
import ProfileImage from "~/components/ui/profile-image";
import { Progress } from "~/components/ui/progress";
import { RankText } from "~/components/ui/rank-text";
import RankBadge from "~/components/ui/RankBadge";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Skeleton } from "~/components/ui/skeleton";
import { Text } from "~/components/ui/text";
import { getUserRank } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { leagues } from "~/lib/constants";
import { ChartBarDecreasing } from "~/lib/icons/ChartBarDecreasing";
import { Cog } from "~/lib/icons/Cog";
import { Users } from "~/lib/icons/Users";

export default function Home() {
  const { data } = authClient.useSession();

  const { data: user, isPending: isUserPending } = useQuery({
    queryKey: ["user", data?.user.id],
    queryFn: getUserRank,
  });

  return (
    <ScrollContainer className="px-0 pt-0" safeAreaInsets>
      <View className="relative w-full">
        <View className="relative overflow-hidden h-40">
          {!data?.user.header ? (
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
            className="w-28 h-28"
            image={data?.user.image!}
            username={data?.user.username!}
          />
        </View>
      </View>
      <View className="flex flex-1 flex-col gap-6 px-4 pt-20">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-col gap-4 items-start">
            <Text className="font-bold text-2xl">{data?.user.username}</Text>
            {isUserPending ? (
              <Skeleton className="h-4 w-1/3" />
            ) : (
              user && <RankBadge showIcon rank={user.rank} />
            )}
          </View>
          <View className="flex flex-row items-center gap-2">
            <Button size="icon" variant="outline">
              <Cog className="text-foreground" size={18} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onPress={() => router.navigate("/social")}
            >
              <Users className="text-foreground" size={18} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onPress={() => router.navigate("/career")}
            >
              <ChartBarDecreasing className="text-foreground" size={18} />
            </Button>
          </View>
        </View>
        {isUserPending ? (
          <View className="flex flex-col gap-2">
            <Skeleton className="h-2 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </View>
        ) : (
          user &&
          (user.nextRank && user.progression !== null ? (
            <View className="flex flex-col gap-2">
              <View className="flex flex-row items-center justify-between">
                <Text className="font-semibold text-muted-foreground text-xl">
                  Progress to next rank
                </Text>
                <Text className="font-bold text-primary text-2xl">
                  {user.progression}%
                </Text>
              </View>
              <Progress value={user.progression} variant="primary" />
              <View className="flex flex-row items-center justify-between w-full">
                <Text className="font-semibold text-muted-foreground flex-1 text-left">
                  0%
                </Text>
                <RankText tier={user.rank.tier} className="flex-1 text-center">
                  {user.nextRank.tier} {user.nextRank.level}
                </RankText>
                <Text className="font-semibold text-muted-foreground flex-1 text-right">
                  100%
                </Text>
              </View>
            </View>
          ) : (
            <View className="flex flex-row gap-1 items-center">
              <Text className="font-bold text-2xl text-primary">
                {user.points}
              </Text>
              <Text className="font-bold text-2xl text-muted-foreground">
                points
              </Text>
            </View>
          ))
        )}
        <View className="flex flex-row items-center gap-3 flex-wrap">
          {leagues.map((league) => (
            <StartMatchCard key={league} league={league} />
          ))}
        </View>
      </View>
    </ScrollContainer>
  );
}
