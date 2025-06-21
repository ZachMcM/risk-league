import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator } from "react-native";
import SignOutButton from "~/components/auth/SignOutButton";
import { RankProgress } from "~/components/home/RankProgress";
import { useSession } from "~/components/providers/SessionProvider";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { getRank } from "~/endpoints";

export default function Home() {
  const { session } = useSession();
  const userId = session?.user.id!;

  const { data: rankInfo, isPending: isRankInfoPending } = useQuery({
    queryKey: ["rank", userId],
    queryFn: async () => await getRank(userId),
  });

  return (
    <ScrollContainer>
      {isRankInfoPending ? (
        <ActivityIndicator className="text-foreground" />
      ) : (
        rankInfo && (
          <RankProgress
            currentRank={rankInfo.currentRank}
            nextRank={rankInfo.nextRank}
            eloRating={rankInfo.eloRating}
            progressToNext={rankInfo.progressToNext}
          />
        )
      )}
    </ScrollContainer>
  );
}
