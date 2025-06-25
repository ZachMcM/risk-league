import { useQuery } from "@tanstack/react-query";
import { Fragment } from "react";
import { ActivityIndicator, View } from "react-native";
import { RankProgress } from "~/components/home/RankProgress";
import StartMatchButton from "~/components/home/StartMatchButton";
import UserInformation from "~/components/home/UserInformation";
import { useSession } from "~/components/providers/SessionProvider";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { getRank } from "~/endpoints";

export default function Home() {
  const { session, isSessionPending } = useSession();
  const userId = session?.user.id!;

  const { data: rankInfo, isPending: isRankInfoPending } = useQuery({
    queryKey: ["rank", userId],
    queryFn: async () => await getRank(userId),
  });

  return (
    <ScrollContainer>
      <View className="flex flex-1 flex-col gap-6">
        {isSessionPending && isRankInfoPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          session &&
          rankInfo && (
            <Fragment>
              <UserInformation
                username={session.user.username}
                image={session.user.image}
                rankString={`${rankInfo.currentRank.tier} ${rankInfo.currentRank.level} `}
              />
              <RankProgress
                eloRating={rankInfo.eloRating}
                currentRank={rankInfo.currentRank}
                nextRank={rankInfo.nextRank}
                progressToNext={rankInfo.progressToNext}
              />
            </Fragment>
          )
        )}
        <StartMatchButton />
      </View>
    </ScrollContainer>
  );
}
