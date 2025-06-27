import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, View } from "react-native";
import { RankProgress } from "~/components/home/RankProgress";
import StartMatchButton from "~/components/home/StartMatchButton";
import UserInformation from "~/components/home/UserInformation";
import { useSession } from "~/components/providers/SessionProvider";
import PageTitle from "~/components/ui/page-title";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { getRank } from "~/endpoints";

export default function Home() {
  const { session, isSessionPending } = useSession();

  const { data: rankInfo, isPending: isRankInfoPending } = useQuery({
    queryKey: ["rank"],
    queryFn: getRank,
  });

  return (
    <ScrollContainer>
      <View className="flex flex-1 flex-col gap-6">
        <PageTitle title="Home" />
        {isSessionPending && isRankInfoPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          session &&
          rankInfo && (
            <View className="flex flex-col gap-4">
              <UserInformation
                username={session.user.username}
                image={session.user.image}
                rankString={`${rankInfo.currentRank.tier} ${rankInfo.currentRank.level} `}
              />
              <RankProgress rankInfo={rankInfo} />
            </View>
          )
        )}
        <StartMatchButton />
      </View>
    </ScrollContainer>
  );
}
