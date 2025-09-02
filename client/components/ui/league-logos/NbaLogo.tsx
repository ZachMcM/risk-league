import { Image, ImageSource } from "expo-image";
import { View, ViewProps } from "react-native";
import { cn } from "~/utils/cn";

interface NbaLogoProps extends ViewProps {
  size?: number;
  className?: string;
}

const nbaLogo = require("~/assets/images/logos/nba.png") as ImageSource;

export default function NbaLogo({
  size = 24,
  className,
  ...props
}: NbaLogoProps) {
  return (
    <View className={cn(className)} {...props}>
      <Image
        source={nbaLogo}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}
