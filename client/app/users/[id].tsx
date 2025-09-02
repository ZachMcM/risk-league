import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import CareerInfo from "~/components/social/CareerInfo";
import FriendshipButtons from "~/components/social/FriendshipButtons";
import ProfileBanner from "~/components/social/ProfileBanner";
import ModalContainer from "~/components/ui/modal-container";
import RankIcon from "~/components/ui/rank-icon";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import { getUser } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function User() {
  const { id } = useLocalSearchParams() as { id: string };

  const { data: user, isPending: isProfilePending } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => await getUser(id),
  });

  const { data: currentUserData } = authClient.useSession();

  return (
    <ModalContainer>
      <ScrollContainer className="pt-10">
        {isProfilePending ? (
          <ActivityIndicator className="text-foreground p-4" />
        ) : (
          user && (
            <View className="flex flex-col">
              <ProfileBanner
                username={user?.username}
                image={user?.image}
                header={user?.banner}
              />
              <View className="flex flex-1 flex-col gap-12 pt-20">
                <View className="flex flex-row items-center justify-between">
                  <View className="flex flex-row items-center">
                    <RankIcon size={64} rank={user.rank} />
                    <Text className="font-bold text-2xl">
                      {currentUserData?.user.username}
                    </Text>
                  </View>
                  {user.id !== currentUserData?.user.id && (
                    <FriendshipButtons
                      portalHost="inside-modal-page"
                      user={user}
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
