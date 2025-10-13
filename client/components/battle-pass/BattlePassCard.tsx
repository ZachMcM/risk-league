import { authClient } from "~/lib/auth-client";
import { Card, CardContent } from "../ui/card";
import { useQuery } from "@tanstack/react-query";
import { BATTLE_PASS_ID } from "~/lib/config";
import { getBattlePassProgress } from "~/endpoints";
import { Fragment, useEffect, useState } from "react";
import { useEntitlements } from "../providers/EntitlementsProvider";
import { cn } from "~/utils/cn";
import { View } from "react-native";
import { Text } from "../ui/text";
import { Button } from "../ui/button";
import { router } from "expo-router";
import { Progress } from "../ui/progress";
import { Image } from "expo-image";
import ProfileImage from "../ui/profile-image";

export default function BattlePassCard() {
  const { data: currentUserData } = authClient.useSession();

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

  const [nextTier, setNextTier] = useState<number | null>(null);

  const {
    seasonZeroBattlePassEntitlementPending,
    seasonZeroBattlePassEntitlement,
  } = useEntitlements();

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
    <Card
      className={cn(
        "mx-6 border-primary/50",
        (battlePassProgressPending || seasonZeroBattlePassEntitlementPending) &&
          "animate-pulse"
      )}
    >
      <CardContent className="p-4 flex flex-col gap-6">
        {battlePassProgress && (
          <Fragment>
            <View className="flex-col gap-1">
              <Text className="font-bold text-xl">
                {battlePassProgress?.battlePass.name} Battle Pass
              </Text>
              {battlePassProgress.currentXp === null ||
              nextTier === null ||
              !seasonZeroBattlePassEntitlement ? (
                <Text className="text-muted-foreground font-semibold max-w-xs">
                  Unlock exclusive rewards and prove that you're the most risky!
                </Text>
              ) : (
                <View className="flex flex-col gap-2">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="font-semibold text-muted-foreground">
                      Progress to Tier {nextTier ?? 0 + 1}
                    </Text>
                    <Text className="font-semibold text-primary">
                      {(
                        (battlePassProgress.currentXp /
                          battlePassProgress.battlePass.tiers[nextTier ?? 0]
                            .xpRequired) *
                        100
                      ).toFixed(0)}
                      %
                    </Text>
                  </View>
                  <Progress
                    variant="primary"
                    value={
                      (battlePassProgress.currentXp /
                        battlePassProgress.battlePass.tiers[nextTier ?? 0]
                          .xpRequired) *
                      100
                    }
                    valueType="percent"
                    className="h-3"
                  />
                </View>
              )}
            </View>
            <View className="flex flex-row items-center">
              <View className="flex flex-row gap-2 items-center flex-1">
                {battlePassProgress.battlePass.tiers[nextTier ?? 0].cosmetic
                  .type === "banner" ? (
                  <View className="relative overflow-hidden rounded-lg h-12 w-20">
                    <Image
                      contentFit="cover"
                      source={
                        battlePassProgress.battlePass.tiers[nextTier ?? 0].cosmetic
                          .url
                      }
                      style={{ width: "100%", height: "100%" }}
                    />
                  </View>
                ) : (
                  <ProfileImage
                    username=""
                    image={
                      battlePassProgress.battlePass.tiers[nextTier ?? 0].cosmetic
                        .url
                    }
                    className="h-12 w-12"
                  />
                )}
                <View className="flex flex-col flex-1">
                  <Text className="font-semibold text-sm text-muted-foreground">
                    {battlePassProgress.currentXp === null ||
                    nextTier === null ||
                    !seasonZeroBattlePassEntitlement
                      ? "Tier 1"
                      : "Next Tier"}
                  </Text>
                  <Text className="font-bold">
                    {
                      battlePassProgress.battlePass.tiers[nextTier ?? 0].cosmetic
                        .title
                    }
                  </Text>
                </View>
              </View>
              <Button onPress={() => router.navigate("/battle-pass")} size="sm">
                <Text>View Battle Pass</Text>
              </Button>
            </View>
          </Fragment>
        )}
      </CardContent>
    </Card>
  );
}
