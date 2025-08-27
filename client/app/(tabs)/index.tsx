import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import PlayCard from "~/components/matches/PlayCard";
import OnboardingDialog from "~/components/onboarding/OnboardingDialog";
import ProfileHeader from "~/components/social/ProfileHeader";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import ProfileImage from "~/components/ui/profile-image";
import { Progress } from "~/components/ui/progress";
import { RankText } from "~/components/ui/rank-text";
import RankBadge from "~/components/ui/RankBadge";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Skeleton } from "~/components/ui/skeleton";
import { Text } from "~/components/ui/text";
import { getUserRank } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { LEAGUES } from "~/lib/config";
import { ChevronRight } from "~/lib/icons/ChevronRight";
import { Cog } from "~/lib/icons/Cog";
import { Ellipsis } from "~/lib/icons/Ellipsis";
import { Trophy } from "~/lib/icons/Trophy";
import { User } from "~/lib/icons/User";
import { Info } from "~/lib/icons/Info"

export default function Home() {
  const { data } = authClient.useSession();

  const { data: userRank, isPending: isUserRankPending } = useQuery({
    queryKey: ["user", data?.user.id, "rank"],
    queryFn: getUserRank,
  });

  const [onboardingDialog, setOnboardingDialog] = useState(
    new Date().getTime() - new Date(data?.user.createdAt!).getTime() <= 6000
  );

  return (
    <ScrollContainer safeAreaInsets>
      <OnboardingDialog
        isOpen={onboardingDialog}
        close={() => setOnboardingDialog(false)}
        onOpenChange={setOnboardingDialog}
      />
      <ProfileHeader
        image={data?.user.image!}
        username={data?.user.username!}
        header={data?.user.header!}
      />
      <View className="flex flex-1 flex-col gap-6 pt-20">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-col gap-4 items-start">
            <Text className="font-bold text-2xl">{data?.user.username}</Text>
            {isUserRankPending ? (
              <Skeleton className="h-6 w-36 rounded-full" />
            ) : (
              userRank && (
                <View className="flex flex-row items-center gap-2">
                  <RankBadge showIcon rank={userRank.rank} />
                  <RankText tier={userRank.rank.tier} className="font-bold">
                    {userRank.points}
                  </RankText>
                </View>
              )
            )}
          </View>
          <View className="flex flex-row items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onPress={() => router.navigate("/settings")}
            >
              <Cog className="text-foreground" size={18} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline">
                  <Ellipsis className="text-foreground" size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 mt-2">
                <DropdownMenuItem
                  className="w-full justify-between"
                  onPress={() => router.navigate("/help")}
                >
                  <View className="flex flex-row items-center gap-2">
                    <Info className="text-foreground" size={18} />
                    <Text>Help</Text>
                  </View>
                  <ChevronRight className="text-foreground" size={18} />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="w-full justify-between"
                  onPress={() => router.navigate("/career")}
                >
                  <View className="flex flex-row items-center gap-2">
                    <User className="text-foreground" size={18} />
                    <Text>Career</Text>
                  </View>
                  <ChevronRight className="text-foreground" size={18} />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="w-full justify-between"
                  onPress={() => router.navigate("/leaderboard")}
                >
                  <View className="flex flex-row items-center gap-2">
                    <Trophy className="text-foreground" size={18} />
                    <Text>Leaderboard</Text>
                  </View>
                  <ChevronRight className="text-foreground" size={18} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </View>
        </View>
        {isUserRankPending ? (
          <View className="flex flex-col gap-2">
            <Skeleton className="h-2 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </View>
        ) : (
          userRank &&
          userRank.nextRank &&
          userRank.progression !== null && (
            <View className="flex flex-col gap-2">
              <View className="flex flex-row items-center justify-between">
                <Text className="font-semibold text-muted-foreground text-xl">
                  Progress to next rank
                </Text>
                <Text className="font-bold text-primary text-2xl">
                  {userRank.progression} / 100
                </Text>
              </View>
              <Progress value={userRank.progression} variant="primary" />
              <View className="flex flex-row items-center justify-between w-full">
                <Text className="font-semibold text-muted-foreground flex-1 text-left">
                  0%
                </Text>
                <RankText
                  tier={userRank.rank.tier}
                  className="flex-1 text-center"
                >
                  {userRank.nextRank.tier} {userRank.nextRank.level}
                </RankText>
                <Text className="font-semibold text-muted-foreground flex-1 text-right">
                  100%
                </Text>
              </View>
            </View>
          )
        )}
        <View className="flex flex-col gap-4">
          <Text className="text-3xl font-bold">Competitive</Text>
          <View className="flex flex-row items-center gap-3 flex-wrap">
            {LEAGUES.map((league) => (
              <PlayCard key={league} league={league} />
            ))}
          </View>
        </View>
      </View>
    </ScrollContainer>
  );
}
