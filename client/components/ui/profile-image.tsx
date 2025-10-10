import { cn } from "~/utils/cn";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Text } from "./text";
import { View } from "react-native";
import { Image } from "expo-image";
import { useState } from "react";

export default function ProfileImage({
  image,
  username,
  className,
}: {
  image: string | null;
  username: string;
  className?: string;
}) {
  const [errorOccurred, setErrorOccurred] = useState(false);

  const handleError = () => {
    if (!errorOccurred) {
      // Prevent infinite loop if fallback also fails
      setErrorOccurred(true);
    }
  };

  return (
    <View
      className={cn(
        cn("h-14 w-14 rounded-full overflow-hidden bg-secondary flex items-center justify-center", className),
        className
      )}
    >
      {errorOccurred || !image ? (
        <Text className="font-semibold text-foreground">
          {username
            .split(" ")
            .map((s) => s[0])
            .join("")}
        </Text>
      ) : (
        <Image
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
          source={image}
          onError={handleError}
        />
      )}
    </View>
  );
}
