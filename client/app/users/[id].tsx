import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import CareerInfo from "~/components/social/CareerInfo";
import FriendshipButtons from "~/components/social/FriendshipButtons";
import ProfileHeader from "~/components/social/ProfileHeader";
import ModalContainer from "~/components/ui/modal-container";
import RankBadge from "~/components/ui/RankBadge";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import { getFriendship, getUser } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function User() {
  const { data: currUserData } = authClient.useSession();

  const { id } = useLocalSearchParams() as { id: string };

  const { data: user, isPending: isProfilePending } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => await getUser(id),
  });

  const { data: friendship, isPending: isFriendshipPending } = useQuery({
    queryKey: ["friendship", currUserData?.user.id, id],
    queryFn: async () => await getFriendship(id),
  });

  return (
    <ModalContainer>
      <ScrollContainer className="pt-10">
        {isProfilePending ? (
          <ActivityIndicator className="text-foreground p-4" />
        ) : (
          user && (
            <View className="flex flex-col">
              <ProfileHeader
                username={user?.username}
                image={user?.image}
                header={user?.header}
              />
              <View className="flex flex-1 flex-col gap-12 pt-20">
                <View className="flex flex-row items-center justify-between">
                  <View className="flex flex-col gap-4 items-start">
                    <Text className="font-bold text-2xl">{user.username}</Text>
                    <RankBadge showIcon rank={user.rank} />
                  </View>
                  {isFriendshipPending ? (
                    <ActivityIndicator className="text-foreground" />
                  ) : (
                    <FriendshipButtons
                      portalHost="inside-modal-page"
                      user={user}
                      friendship={friendship}
                    />
                  )}
                </View>
                <View className="flex flex-col gap-6">
                  <Text className="font-bold text-3xl">Career</Text>
                  <CareerInfo userId={id} />
                </View>
              </View>
            </View>
          )
        )}
      </ScrollContainer>
    </ModalContainer>
  );
}
