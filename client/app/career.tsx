import { View } from "react-native";
import CareerInfo from "~/components/social/CareerInfo";
import ModalContainer from "~/components/ui/modal-container";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";

export default function Career() {
  const { data: currentUserData } = authClient.useSession();

  return (
    <ModalContainer>
      <ScrollContainer className="pt-10">
        <View className="flex flex-col gap-6">
          <Text className="font-bold text-4xl">Career</Text>
          <CareerInfo userId={currentUserData?.user.id!} />
        </View>
      </ScrollContainer>
    </ModalContainer>
  );
}
