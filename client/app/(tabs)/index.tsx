import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { RankProgress } from "~/components/home/RankProgress";
import StartMatchButton from "~/components/home/StartMatchButton";
import { useSession } from "~/components/providers/SessionProvider";
import { Button } from "~/components/ui/button";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import { getRank } from "~/endpoints";

export default function Home() {
  const { session } = useSession();
  const userId = session?.user.id!;

  const { data: rankInfo, isPending: isRankInfoPending } = useQuery({
    queryKey: ["rank", userId],
    queryFn: async () => await getRank(userId),
  });

  const router = useRouter();

  return (
    <ScrollContainer>
      <View className="flex flex-1 flex-col gap-6">
        {isRankInfoPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          rankInfo && (
            <RankProgress
              eloRating={rankInfo.eloRating}
              currentRank={rankInfo.currentRank}
              nextRank={rankInfo.nextRank}
              progressToNext={rankInfo.progressToNext}
            />
          )
        )}
        <StartMatchButton/>
      </View>
    </ScrollContainer>
  );
}
