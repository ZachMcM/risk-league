import { Image } from "expo-image";

export default function PlayerImage({
  scale = 1,
  image,
}: {
  scale?: number;
  image: string | null;
}) {
  return (
    <Image
      contentFit="contain"
      source={image ?? process.env.EXPO_PUBLIC_PLAYER_FALLBACK_IMAGE}
      style={{ width: 80 * scale, height: 60 * scale }}
    />
  );
}
