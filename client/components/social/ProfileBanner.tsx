import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { authClient } from "~/lib/auth-client";
import ProfileImage from "../ui/profile-image";

export default function ProfileBanner({
  header,
  image,
  username,
  userId,
}: {
  header?: string;
  image?: string;
  username: string;
  userId: string;
}) {
  const { data: currentUserData } = authClient.useSession();

  return (
    <View className="w-full">
      <Pressable
        onPress={() => {
          if (currentUserData?.user.id === userId) {
            router.navigate("/banner-locker");
          }
        }}
        className="relative overflow-hidden rounded-xl h-36"
      >
        {!header ? (
          <View className="w-full h-full bg-primary rounded-xl" />
        ) : (
          <Image
            contentFit="cover"
            source={header}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </Pressable>
      <View className="absolute -bottom-16 left-4 p-2 bg-background rounded-full">
        <Pressable
          onPress={() => {
            if (currentUserData?.user.id == userId) {
              router.navigate("/image-locker");
            }
          }}
        >
          <ProfileImage
            className="w-28 h-28"
            image={image!}
            username={username}
          />
        </Pressable>
      </View>
    </View>
  );
}
