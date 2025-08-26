import { Image } from "expo-image";
import { View } from "react-native";
import ProfileImage from "../ui/profile-image";

export default function ProfileHeader({
  header,
  image,
  username,
}: {
  header?: string;
  image?: string;
  username: string;
}) {
  return (
    <View className="w-full">
      <View className="relative overflow-hidden h-36">
        {!header ? (
          <View className="w-full h-full bg-primary rounded-lg" />
        ) : (
          <View className="rounded-lg overflow-hidden">
            <Image
              contentFit="cover"
              source={header}
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        )}
      </View>
      <View className="absolute -bottom-16 left-4 p-2 bg-background rounded-full">
        <ProfileImage
          className="w-28 h-28"
          image={image!}
          username={username}
        />
      </View>
    </View>
  );
}
