import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Purchases from "react-native-purchases";
import { toast } from "sonner-native";
import {
  getAllUserCosmetics,
  getBattlePassProgress,
  postUserBattlePass,
} from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { BATTLE_PASS_ID, BATTLE_PASS_NAME } from "~/lib/config";
import { useEntitlements } from "../providers/EntitlementsProvider";
import { Card, CardContent } from "../ui/card";
import { ActivityIndicator, View } from "react-native";
import { Text } from "../ui/text";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BattlePassHeader() {
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

  const queryClient = useQueryClient();

  const { mutate: acquireBattlePass, isPending: acquiringBattlePass } =
    useMutation({
      mutationFn: async () => {
        // Get current offerings
        const offerings = await Purchases.getOfferings();

        // Get the specific offering by identifier
        const battlePassOffering = offerings.all["season-zero-battle-pass"];

        if (!battlePassOffering) {
          throw new Error("Battle Pass offering not found");
        }

        // Get the package you want to purchase
        // You can use availablePackages[0] or find a specific package
        // For example: battlePassOffering.availablePackages.find(pkg => pkg.identifier === 'your_package_id')
        const packageToPurchase = battlePassOffering.availablePackages[0];

        if (!packageToPurchase) {
          throw new Error("No package available for purchase");
        }

        // Purchase the package directly
        const { customerInfo } = await Purchases.purchasePackage(
          packageToPurchase
        );

        // Check if the purchase was successful by checking entitlements
        const hasEntitlement =
          customerInfo.entitlements.active["Season Zero Battle Pass"] !==
          undefined;

        if (hasEntitlement) {
          await postUserBattlePass();
          return true;
        }

        return false;
      },
      onSuccess: (succesfullyPurchased) => {
        queryClient.invalidateQueries({
          queryKey: ["entitlements", "Season Zero Battle Pass"],
        });
        if (succesfullyPurchased) {
          queryClient.invalidateQueries({
            queryKey: [
              "battle-pass",
              BATTLE_PASS_ID,
              "progress",
              currentUserData?.user.id,
            ],
          });
          toast.success("Successfully purchased Battle Pass!");
        }
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

  const {
    seasonZeroBattlePassEntitlementPending,
    seasonZeroBattlePassEntitlement,
  } = useEntitlements();

  const insets = useSafeAreaInsets();

  return (
    <View style={{ marginTop: insets.top }} className="flex flex-col gap-6 p-6">
      <View className="flex flex-col">
        <Text className="font-bold text-muted-foreground text-lg">{BATTLE_PASS_NAME}</Text>
        <Text className="font-bold text-4xl">Battle Pass</Text>
      </View>
      {battlePassProgressPending || seasonZeroBattlePassEntitlementPending ? (
        <ActivityIndicator className="text-foreground" />
      ) : (
        battlePassProgress &&
        (battlePassProgress.currentXp === null ||
        nextTier === null ||
        !seasonZeroBattlePassEntitlement ? (
          <Card>
            <CardContent className="p-4 flex flex-row gap-4 items-center">
              <View className="flex flex-col flex-1 gap-1">
                <Text className="font-bold text-xl">{battlePassProgress.battlePass.name} Battle Pass</Text>
                <Text className="text-muted-foreground font-semibold text-sm">
                  Unlock exclusive rewards and prove that you're the most risky!
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
                  battlePassProgress.battlePass.tiers[nextTier!].xpRequired) *
                100
              }
              showValueText
              valueType="percent"
              className="h-3"
            />
          </View>
        ))
      )}
    </View>
  );
}
