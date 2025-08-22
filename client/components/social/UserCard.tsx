import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import {
  getUser
} from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { Friendship, User } from "~/types/user";
import RankBadge from "../ui/RankBadge";
import ProfileImage from "../ui/profile-image";
import { Text } from "../ui/text";
import FriendshipButtons from "./FriendshipButtons";

export function UserCard({
  user,
  friendship,
}: {
  user: User;
  friendship?: Friendship;
}) {
  const { data } = authClient.useSession();
  console.log(friendship);

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
        <View className="flex flex-col gap-2">
          <Text className="font-bold text-lg">{userProfile.username}</Text>
          <RankBadge
            iconClassName="h-4 w-4"
            textClassName="text-xs"
            gradientStyle={{
              paddingHorizontal: 8,
              gap: 4,
              alignSelf: "flex-start",
            }}
            rank={userProfile.rank}
            showIcon
          />
        </View>
      </View>
      <FriendshipButtons user={user} friendship={friendship} />
    </Pressable>
  );
}
