import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

interface Props {
  style?: StyleProp<ImageStyle>;
  width?: number;
  height?: number;
}

export const NBAIcon: React.FC<Props> = ({
  style,
  width = 24,
  height = 24,
}) => {
  return (
    <Image
      source={require("~/assets/images/National_Basketball_Association_logo.svg.png")}
      style={[{ width, height }, style]}
      resizeMode="contain"
    />
  );
};