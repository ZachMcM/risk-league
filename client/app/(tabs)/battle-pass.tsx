import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Check, LockKeyhole } from "lucide-react-native";
import { Fragment, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { toast } from "sonner-native";
import BannerAdWrapper from "~/components/ad-wrappers/Banner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import ProfileImage from "~/components/ui/profile-image";
import { Progress } from "~/components/ui/progress";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Separator } from "~/components/ui/separator";
import { Text } from "~/components/ui/text";
import {
  getAllUserCosmetics,
  getBattlePassProgress,
  postClaimBattlePassTier,
  postUserBattlePass,
} from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { BATTLE_PASS_ID } from "~/lib/config";
import { Cosmetic } from "~/types/battlePass";
import { cn } from "~/utils/cn";

function BattlePassTier({
  tier,
  tierId,
  cosmetic,
  xpRequired,
  currentXp,
  showSeparator,
  allCosmetics,
}: {
  tierId: number;
  tier: number;
  cosmetic: Cosmetic;
  xpRequired: number;
  currentXp: number;
  showSeparator: boolean;
  allCosmetics: { cosmeticId: number }[];
}) {
  const queryClient = useQueryClient();
  const { data: currentUserData } = authClient.useSession();

  const { mutate: claimTier, isPending: isClaimTierPending } = useMutation({
    mutationFn: async () => await postClaimBattlePassTier(tierId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user", currentUserData?.user.id!, "cosmetics"],
      });
      toast.success("Claimed tier!");
      router.navigate(
        cosmetic.type == "banner" ? "/banner-locker" : "/image-locker"
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const hasCosmetic =
    allCosmetics.find((c) => c.cosmeticId == cosmetic.id) !== undefined;

  return (
    <Fragment key={tier}>
      <View className="flex flex-col items-center gap-4 w-full">
        <View className="flex flex-col gap-4 items-center">
          {!hasCosmetic && currentXp! >= xpRequired && (
            <Button
              onPress={() => claimTier()}
              variant="foreground"
              className="flex flex-row items-center gap-2 animate-pulse rounded-full self-center"
              disabled={isClaimTierPending}
            >
              <Text>Claim!</Text>
              {isClaimTierPending && (
                <ActivityIndicator className="text-background" />
              )}
            </Button>
          )}
          <View className="flex flex-row items-center gap-2">
            <Badge>
              <Text className="text-2xl">{tier}.</Text>
            </Badge>
            <Text className="font-bold text-2xl">{cosmetic.title}</Text>
            {hasCosmetic && (
              <Icon as={Check} className="text-muted-foreground" size={24} />
            )}
          </View>
        </View>

        <View className="relative w-full items-center">
          {cosmetic.type == "banner" ? (
            <View
              className={cn(
                "relative overflow-hidden rounded-xl h-36 w-full",
                !hasCosmetic && "opacity-25"
              )}
            >
              <Image
                contentFit="cover"
                source={cosmetic.url}
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          ) : (
            <ProfileImage
              username=""
              image={cosmetic.url}
              className={cn("h-36 w-36", !hasCosmetic && "opacity-25")}
            />
          )}
          {currentXp === null && (
            <View className="absolute inset-0 justify-center items-center">
              <Icon
                as={LockKeyhole}
                className="text-muted-foreground"
                size={28}
              />
            </View>
          )}
        </View>
      </View>
      {showSeparator && (
        <Separator className="h-20 w-0.5 rounded-full" orientation="vertical" />
      )}
    </Fragment>
  );
}

export default function BattlePass() {
  const { data: currentUserData } = authClient.useSession();

  const { data: allCosmetics, isPending: allCosmeticsPending } = useQuery({
    queryKey: ["user", currentUserData?.user.id!, "cosmetics"],
    queryFn: getAllUserCosmetics,
  });

  const { data: battlePassProgress, isPending: battlePassProgressPending } =
    useQuery({
      queryKey: [
        "battle-pass",
        BATTLE_PASS_ID,
        "progress",
        currentUserData?.user.id!,
      ],
      queryFn: getBattlePassProgress,
    });

  const queryClient = useQueryClient();

  const { mutate: acquireBattlePass, isPending: acquiringBattlePass } =
    useMutation({
      mutationFn: postUserBattlePass,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "battle-pass",
            BATTLE_PASS_ID,
            "progress",
            currentUserData?.user.id,
          ],
        });
        toast.success("Successfully purchased Battle Pass!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const [nextTier, setNextTier] = useState<number | null>(null);

  useEffect(() => {
    if (battlePassProgress && battlePassProgress.currentXp !== null) {
      let tierIndex = 0;
      while (
        battlePassProgress.currentXp >
        battlePassProgress.battlePass.tiers[tierIndex].xpRequired
      ) {
        tierIndex++;
      }
      setNextTier(tierIndex);
    }
  }, [battlePassProgress?.currentXp]);

  return (
    <ScrollContainer>
      {battlePassProgressPending || allCosmeticsPending ? (
        <ActivityIndicator className="text-foreground" />
      ) : (
        battlePassProgress &&
        allCosmetics && (
          <View className="flex flex-1 flex-col gap-6">
            <BannerAdWrapper />
            {battlePassProgress.currentXp === null || nextTier === null ? (
              <Card>
                <CardContent className="p-4 flex flex-row gap-4 items-center">
                  <View className="flex flex-col flex-1">
                    <Text className="font-bold text-xl">
                      Unlock Battle Pass
                    </Text>
                    <Text className="text-muted-foreground font-semibold text-sm">
                      Unlock exclusive rewards and prove that your the most
                      risky!
                    </Text>
                  </View>
                  <Button
                    className="flex flex-row items-center gap-2"
                    onPress={() => acquireBattlePass()}
                    disabled={acquiringBattlePass}
                  >
                    <Text>Purchase!</Text>
                    {acquiringBattlePass && (
                      <ActivityIndicator className="text-foreground" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <View className="flex flex-col gap-2">
                <Text className="font-bold text-xl">
                  Progress to Tier {nextTier! + 1}
                </Text>
                <Progress
                  variant="primary"
                  value={
                    (battlePassProgress.currentXp /
                      battlePassProgress.battlePass.tiers[nextTier!]
                        .xpRequired) *
                    100
                  }
                  showValueText
                  valueType="percent"
                  className="h-3"
                />
              </View>
            )}
            <View className="flex flex-col items-center gap-4 relative">
              {battlePassProgress.battlePass.tiers.map(
                ({ tier, cosmetic, xpRequired, id }, index) => (
                  <BattlePassTier
                    key={id}
                    tierId={id}
                    tier={tier}
                    cosmetic={cosmetic}
                    xpRequired={xpRequired}
                    allCosmetics={allCosmetics}
                    showSeparator={
                      index < battlePassProgress.battlePass.tiers.length - 1
                    }
                    currentXp={battlePassProgress.currentXp!}
                  />
                )
              )}
            </View>
          </View>
        )
      )}
    </ScrollContainer>
  );
}
