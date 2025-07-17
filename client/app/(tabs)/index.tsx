import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, View } from "react-native";
import SignOutButton from "~/components/auth/SignOutButton";
import { RankProgress } from "~/components/home/RankProgress";
import StartMatchButton from "~/components/matches/StartMatchButton";
import { useSession } from "~/components/providers/SessionProvider";
import Pfp from "~/components/ui/pfp";
import RankBadge from "~/components/ui/RankBadge";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import { getActiveLeagues, getUser } from "~/endpoints";
import { getRank } from "~/lib/utils";

export default function Home() {
  const { session } = useSession();

  if (!session) return;

  const { data: user, isPending: isUserPending } = useQuery({
    queryKey: ["user", session.user.id],
    queryFn: async () => await getUser(session?.user.id!),
  });

  const { data: activeLeagues, isPending: isActiveLeaguesPending } = useQuery({
    queryKey: ["active-leagues"],
    queryFn: getActiveLeagues,
  });

  const rank = getRank(user?.eloRating!);

  return (
    <ScrollContainer className="pt-24 pb-12">
      <View className="flex flex-1 flex-col gap-8">
        <View className="flex flex-col items-center gap-3">
          <Pfp
            username={session.user.username}
            image={session.user.image}
            className="h-24 w-24 border-2"
          />
          <Text className="font-bold text-3xl">{session.user.username}</Text>
          {isUserPending ? (
            <ActivityIndicator className="text-foreground" />
          ) : (
            user && (
              <RankBadge
                tier={rank.currentRank.tier}
                level={rank.currentRank.level}
              />
            )
          )}
        </View>
        {isActiveLeaguesPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          activeLeagues && <StartMatchButton activeLeagues={activeLeagues} />
        )}
        {isUserPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          user && <RankProgress rank={rank} />
        )}
      </View>
    </ScrollContainer>
  );
}
