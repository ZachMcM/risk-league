import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Button } from "~/components/ui/button";
import { GridItemWrapper } from "~/components/ui/grid-item-wrapper";
import ModalContainer from "~/components/ui/modal-container";
import ProfileImage from "~/components/ui/profile-image";
import { Separator } from "~/components/ui/separator";
import { Text } from "~/components/ui/text";
import { getUserCosmetics } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { cn } from "~/utils/cn";

export default function ImagesLocker() {
  const { data: currentUserData, refetch } = authClient.useSession();

  const { data: imagesData, isPending: areImagesPending } = useQuery({
    queryKey: ["user", currentUserData?.user.id!, "images"],
    queryFn: async () => await getUserCosmetics("image"),
  });

  const images = imagesData
    ? (() => {
        const currentImageIndex = imagesData.findIndex(
          (image) => image.url == currentUserData?.user.image
        );
        if (currentImageIndex > 0) {
          const reorderedImages = [...imagesData];
          const [currentImage] = reorderedImages.splice(currentImageIndex, 1);
          reorderedImages.unshift(currentImage);
          return reorderedImages;
        }
        return imagesData;
      })()
    : undefined;

  const [selectedIndex, setSelectedIndex] = useState(0);

  const [isPending, setIsPending] = useState(false);

  async function handleApplyChanges() {
    if (selectedIndex && images) {
      setIsPending(true);
      const { error } = await authClient.updateUser({
        image: images[selectedIndex].url,
      });
      setIsPending(false);
      if (error && error.message) {
        toast.error(error.message);
      } else {
        toast.success("Successfully updated image");
        router.dismiss();
      }
    }
  }

  const insets = useSafeAreaInsets();

  return (
    <ModalContainer>
      <View className="flex flex-1 flex-col gap-4 pt-10 px-4">
        {areImagesPending ? (
          <ActivityIndicator color="#6b7280" className="p-4" />
        ) : (
          images && (
            <View className="flex flex-1 flex-col gap-4">
              <FlashList
                numColumns={3}
                estimatedItemSize={120}
                showsVerticalScrollIndicator={false}
                data={images}
                renderItem={({ item, index }) => (
                  <GridItemWrapper gap={12} index={index} numCols={3}>
                    <View className="flex flex-col gap-2">
                      <Pressable
                        className="rounded-full items-center"
                        onPress={() => setSelectedIndex(index)}
                      >
                        <ProfileImage
                          username=""
                          image={item.url}
                          className={cn(
                            "h-24 w-24 border-2 border-background",
                            selectedIndex == index && "border-primary"
                          )}
                        />
                      </Pressable>
                      <Text className="text-center font-bold">
                        {item.title}
                      </Text>
                    </View>
                  </GridItemWrapper>
                )}
                keyExtractor={(item, index) => `${item.url}-${index}`}
                extraData={selectedIndex}
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
                {images && selectedIndex !== null && (
                  <Button
                    disabled={isPending}
                    className="flex flex-row items-center gap-2"
                    onPress={handleApplyChanges}
                  >
                    <Text>Apply Changes</Text>
                    {isPending && <ActivityIndicator color="#ffffff" />}
                  </Button>
                )}
              </View>
            </View>
          )
        )}
      </View>
    </ModalContainer>
  );
}
