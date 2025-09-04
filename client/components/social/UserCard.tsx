import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { getUser } from "~/endpoints";
import { User } from "~/types/user";
import ProfileImage from "../ui/profile-image";
import RankIcon from "../ui/rank-icon";
import { Text } from "../ui/text";
import FriendshipButtons from "./FriendshipButtons";

export function UserCard({ user }: { user: User }) {
  const { data: userProfile } = useQuery({
    queryKey: ["user", user.id],
    queryFn: async () => await getUser(user.id),
    initialData: user,
  });

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/users/[id]",
          params: { id: user.id },
        })
      }
      className="flex flex-row items-center justify-between"
    >
      <View className="flex flex-row items-center gap-3">
        <ProfileImage
          className="h-14 w-14"
          username={userProfile.username}
          image={userProfile.image!}
        />
        <View className="flex flex-row items-center gap-2">
          <RankIcon rank={userProfile.rank} size={28} />
          <Text className="font-bold text-lg">{userProfile.username}</Text>
        </View>
      </View>
      <FriendshipButtons user={user} />
    </Pressable>
  );
}
