import { Image } from "expo-image";
import { View } from "react-native";
import { cn } from "~/utils/cn";

export default function PlayerImage({
  image,
  className
}: {
  image: string | null;
  className?: string
}) {
  return (
    <View className={cn("border-2 rounded-full overflow-hidden w-14 h-14 border-border", className)}>
      <Image
        contentFit="cover"
        style={{ width: "100%", height: "100%" }}
        source={
          image ??
          process.env.EXPO_PUBLIC_PLAYER_FALLBACK_IMAGE
        }
      />
    </View>
  );
}
