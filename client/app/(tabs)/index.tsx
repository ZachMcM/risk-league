import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, View } from "react-native";
import SignOutButton from "~/components/auth/SignOutButton";
import { RankProgress } from "~/components/home/RankProgress";
import StartMatchButton from "~/components/matches/StartMatchButton";
import UserInformation from "~/components/home/UserInformation";
import { useSession } from "~/components/providers/SessionProvider";
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
      {isSessionPending && isRankInfoPending ? (
        <ActivityIndicator className="text-foreground" />
      ) : (
        session &&
        rankInfo && (
          <View className="flex flex-1 flex-col gap-6">
            <UserInformation
              username={session.user.username}
              image={session.user.image}
              rank={`${rankInfo.currentRank.tier} ${rankInfo.currentRank.level} `}
            />
            <RankProgress rankInfo={rankInfo} />
            <StartMatchButton />
            <SignOutButton />
          </View>
        )
      )}
    </ScrollContainer>
  );
}
