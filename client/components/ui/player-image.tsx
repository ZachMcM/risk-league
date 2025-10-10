import { Image } from "expo-image";
import { View } from "react-native";
import { cn } from "~/utils/cn";

export default function PlayerImage({
  image,
  className,
}: {
  image: string | null;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "border-2 border-border rounded-full overflow-hidden w-14 h-14 bg-card",
        className
      )}
    >
      <Image
        contentFit="cover"
        style={{ width: "100%", height: "100%" }}
        source={
          image ??
          "https://pub-6820f22e14b7440689345924f1390aed.r2.dev/players/default.png"
        }
      />
    </View>
  );
}
