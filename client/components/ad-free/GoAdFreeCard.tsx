import { useQueryClient } from "@tanstack/react-query";
import { Ban } from "lucide-react-native";
import { View } from "react-native";
import RevenueCatUI from "react-native-purchases-ui";
import { cn } from "~/utils/cn";
import { useEntitlements } from "../providers/EntitlementsProvider";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";

export default function GoAdFreeCard() {
  const { adFreeEntitlementPending, adFreeEntitlement } = useEntitlements();
  const queryClient = useQueryClient();

  async function presentAdFreePaywall() {
    await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: "No Ads",
    });
    queryClient.invalidateQueries({ queryKey: ["customers", "No Ads"] });
  }

  // Don't show the card if user already has ad-free
  if (adFreeEntitlement) {
    return null;
  }

  return (
    <Card
      className={cn(
        "border-primary/50 bg-gradient-to-br flex-1",
        adFreeEntitlementPending && "animate-pulse"
      )}
    >
      <CardContent className="p-4 flex flex-col justify-between flex-1 gap-4">
        <View className="flex flex-col gap-1">
          <View className="flex flex-row items-center gap-2">
            <Icon as={Ban} className="text-primary" size={20} />
            <Text className="font-bold text-xl">
              Play Risk League WITHOUT Ads!
            </Text>
          </View>
          <Text className="text-muted-foreground font-semibold max-w-xs">
            Risk League, uninterrupted — without annoying ads!
          </Text>
        </View>
        <Button
          onPress={presentAdFreePaywall}
          size="sm"
          className="self-start"
        >
          <Text className="font-bold">Upgrade Now</Text>
        </Button>
      </CardContent>
    </Card>
  );
}
