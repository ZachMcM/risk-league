import { Image, ImageSource } from "expo-image";
import { View, ViewProps } from "react-native";
import { cn } from "~/utils/cn";

interface MlbLogoProps extends ViewProps {
  size?: number;
  className?: string;
}

const mlbLogo = require("~/assets/images/logos/mlb.png") as ImageSource;

export default function MlbLogo({
  size = 24,
  className,
  ...props
}: MlbLogoProps) {
  return (
    <View className={cn("", className)} {...props}>
      <Image
        source={mlbLogo}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}
