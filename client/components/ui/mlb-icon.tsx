import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

interface Props {
  style?: StyleProp<ImageStyle>;
  width?: number;
  height?: number;
}

export const MLBIcon: React.FC<Props> = ({
  style,
  width = 24,
  height = 24,
}) => {
  return (
    <Image
      source={require("~/assets/images/Major_League_Baseball_logo.svg.webp")}
      style={[{ width, height }, style]}
      resizeMode="contain"
    />
  );
};