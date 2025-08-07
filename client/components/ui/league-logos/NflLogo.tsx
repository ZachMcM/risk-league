import { Image, ImageSource } from "expo-image";
import { View, ViewProps } from "react-native";
import { cn } from "~/utils/cn";

interface NflLogoProps extends ViewProps {
  size?: number;
  className?: string;
}

const nflLogo = require("~/assets/images/logos/nfl.png") as ImageSource;

export default function NflLogo({ size = 24, className, ...props }: NflLogoProps) {
  return (
    <View className={cn("", className)} {...props}>
      <Image
        source={nflLogo}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}