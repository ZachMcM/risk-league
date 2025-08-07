import { Image, ImageSource } from "expo-image";
import { View, ViewProps } from "react-native";
import { cn } from "~/utils/cn";

interface NcaaLogoProps extends ViewProps {
  size?: number;
  className?: string;
}

const ncaaLogo = require("~/assets/images/logos/ncaa.png") as ImageSource;

export default function NcaaLogo({ size = 24, className, ...props }: NcaaLogoProps) {
  return (
    <View className={cn("", className)} {...props}>
      <Image
        source={ncaaLogo}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}