import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { BadgeInfoIcon } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import BannerAdWrapper from "~/components/ad-wrappers/Banner";
import CompetitiveMatchLeagues from "~/components/matches/CompetitiveMatchLeagues";
import OnboardingDialog from "~/components/onboarding/OnboardingDialog";
import ProfileBanner from "~/components/social/ProfileBanner";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Icon } from "~/components/ui/icon";
import { Progress } from "~/components/ui/progress";
import RankIcon from "~/components/ui/rank-icon";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Skeleton } from "~/components/ui/skeleton";
import { Text } from "~/components/ui/text";
import { getUserRank } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { ChevronRight } from "~/lib/icons/ChevronRight";
import { Cog } from "~/lib/icons/Cog";
import { Ellipsis } from "~/lib/icons/Ellipsis";
import { Trophy } from "~/lib/icons/Trophy";
import { User } from "~/lib/icons/User";

export default function Home() {
  const { data: currentUserData } = authClient.useSession();

  const { data: userRank, isPending: isUserRankPending } = useQuery({
    queryKey: ["user", currentUserData?.user.id, "rank"],
    queryFn: getUserRank,
  });

  const [onboardingDialog, setOnboardingDialog] = useState(
    new Date().getTime() -
      new Date(currentUserData?.user.createdAt!).getTime() <=
      10000
  );

  return (
    <ScrollContainer safeAreaInsets>
      <OnboardingDialog
        isOpen={onboardingDialog}
        close={() => setOnboardingDialog(false)}
        onOpenChange={setOnboardingDialog}
      />
      <ProfileBanner
        image={currentUserData?.user.image!}
        username={currentUserData?.user.username!}
        header={currentUserData?.user.banner!}
        userId={currentUserData?.user.id!}
      />
      <View className="flex flex-1 flex-col gap-6 pt-20">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-3">
            {userRank?.rank && <RankIcon rank={userRank.rank} />}
            <Text className="font-bold text-2xl">
              {currentUserData?.user.username}
            </Text>
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
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem
                    className="w-full justify-between"
                    onPress={() => router.navigate("/help")}
                  >
                    <View className="flex flex-row items-center gap-2">
                      <Icon
                        as={BadgeInfoIcon}
                        className="text-foreground"
                        size={16}
                      />
                      <Text>Help</Text>
                    </View>
                    <ChevronRight className="text-foreground" size={16} />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="w-full justify-between"
                    onPress={() => router.navigate("/career")}
                  >
                    <View className="flex flex-row items-center gap-2">
                      <User className="text-foreground" size={18} />
                      <Text>Career</Text>
                    </View>
                    <ChevronRight className="text-foreground" size={16} />
                  </DropdownMenuItem>
                </DropdownMenuGroup>
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
                <RankIcon rank={userRank.nextRank} />
                <Text className="font-semibold text-muted-foreground flex-1 text-right">
                  100%
                </Text>
              </View>
            </View>
          )
        )}
        <BannerAdWrapper />
        <CompetitiveMatchLeagues />
      </View>
    </ScrollContainer>
  );
}
