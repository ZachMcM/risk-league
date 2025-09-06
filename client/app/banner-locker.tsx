import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Button } from "~/components/ui/button";
import { GridItemWrapper } from "~/components/ui/grid-item-wrapper";
import ModalContainer from "~/components/ui/modal-container";
import { Separator } from "~/components/ui/separator";
import { Text } from "~/components/ui/text";
import { getUserCosmetics, patchUserBanner } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { cn } from "~/utils/cn";

function BannerItem({
  setFunction,
  selectedIndex,
  index,
  title,
  url,
}: {
  setFunction: () => void;
  selectedIndex?: number;
  index: number;
  title: string;
  url: string;
}) {
  return (
    <View className="flex flex-col gap-2">
      <Pressable
        onPress={setFunction}
        className={cn(
          "relative overflow-hidden rounded-xl h-36 w-full border-2 border-background",
          selectedIndex === index && "border-primary"
        )}
      >
        <Image
          contentFit="cover"
          source={url}
          style={{ width: "100%", height: "100%" }}
        />
      </Pressable>
      <Text className="text-start font-semibold">{title}</Text>
    </View>
  );
}

export default function BannerLocker() {
  const { data: currentUserData, refetch } = authClient.useSession();

  const { data: bannersData, isPending: areBannersPending } = useQuery({
    queryKey: ["user", currentUserData?.user.id!, "banners"],
    queryFn: async () => await getUserCosmetics("banner"),
  });

  const banners = bannersData ? (() => {
    const currentBannerIndex = bannersData.findIndex(
      (banner) => banner.url == currentUserData?.user.banner
    );
    if (currentBannerIndex > 0) {
      const reorderedBanners = [...bannersData];
      const [currentBanner] = reorderedBanners.splice(currentBannerIndex, 1);
      reorderedBanners.unshift(currentBanner);
      return reorderedBanners;
    }
    return bannersData;
  })() : undefined;

  const [selectedBannerIndex, setSelectedBannerIndex] = useState(0);

  const { mutate: updateBanner, isPending: isUpdatingBanner } = useMutation({
    mutationFn: async ({ banner }: { banner: string }) =>
      await patchUserBanner(banner),
    onSuccess: () => {
      refetch();
      toast.success("Successfully updated your banner!");
      router.dismiss();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function handleApplyChanges() {
    if (selectedBannerIndex && banners) {
      updateBanner({ banner: banners[selectedBannerIndex].url });
    }
  }

  const insets = useSafeAreaInsets();

  return (
    <ModalContainer>
      <View className="flex flex-1 flex-col gap-4 pt-10 px-4">
        <Text className="font-bold text-4xl">Your Banners</Text>
        <View className="flex-1">
          {areBannersPending ? (
            <ActivityIndicator color="#6b7280" className="p-4" />
          ) : (
            banners && (
              <View className="flex flex-1 flex-col gap-4">
                <FlashList
                  estimatedItemSize={60}
                  showsVerticalScrollIndicator={false}
                  data={banners}
                  renderItem={({ item, index }) => (
                    <GridItemWrapper index={index} gap={12} numCols={1}>
                      <BannerItem
                        index={index}
                        url={item.url}
                        title={item.title}
                        selectedIndex={selectedBannerIndex}
                        setFunction={() => setSelectedBannerIndex(index)}
                      />
                    </GridItemWrapper>
                  )}
                  keyExtractor={(item, index) => `${item.url}-${index}`}
                  extraData={selectedBannerIndex}
                  contentContainerStyle={{ paddingBottom: 12 }}
                />
                <Separator />
                <View
                  className="flex flex-row items-center gap-2 self-end"
                  style={{
                    marginBottom: insets.bottom,
                  }}
                >
                  <Button onPress={() => router.dismiss()} variant="outline">
                    <Text>Cancel</Text>
                  </Button>
                  {banners && selectedBannerIndex !== null && (
                    <Button
                      disabled={isUpdatingBanner}
                      className="flex flex-row items-center gap-2"
                      onPress={handleApplyChanges}
                    >
                      <Text>Apply Changes</Text>
                      {isUpdatingBanner && (
                        <ActivityIndicator color="#ffffff" />
                      )}
                    </Button>
                  )}
                </View>
              </View>
            )
          )}
        </View>
      </View>
    </ModalContainer>
  );
}
