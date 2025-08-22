import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import RankGraph from "~/components/career/RankGraph";
import CareerInfo from "~/components/social/CareerInfo";
import { Card, CardContent } from "~/components/ui/card";
import ModalContainer from "~/components/ui/modal-container";
import { Progress } from "~/components/ui/progress";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Skeleton } from "~/components/ui/skeleton";
import { Text } from "~/components/ui/text";
import { getCareer } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function Career() {
  const { data } = authClient.useSession();

  return (
    <ModalContainer>
      <ScrollContainer className="pt-10">
        <View className="flex flex-col gap-6">
          <Text className="font-bold text-4xl">Career</Text>
          <CareerInfo userId={data?.user.id!} />
        </View>
      </ScrollContainer>
    </ModalContainer>
  );
}
