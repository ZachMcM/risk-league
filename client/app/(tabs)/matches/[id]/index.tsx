import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment } from "react";
import { ActivityIndicator, View } from "react-native";
import MatchStatsCard from "~/components/matches/MatchStatsCard";
import { useMatch } from "~/components/providers/MatchMessagesProvider";
import { Button } from "~/components/ui/button";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { MessageCircle } from "~/lib/icons/MessageCircle";

export default function Match() {
  const { id } = useLocalSearchParams() as { id: string };
  const { statsPending, opponentStatsPending, stats, opponentStats } =
    useMatch();

  const router = useRouter();

  return (
    <Fragment>
      <ScrollContainer>
        <View className="flex flex-1 flex-col gap-6">
          {statsPending && opponentStatsPending ? (
            <ActivityIndicator className="text-foreground" />
          ) : (
            <View className="flex flex-col gap-4">
              {stats && <MatchStatsCard stats={stats} />}
              {opponentStats && <MatchStatsCard stats={opponentStats} />}
            </View>
          )}
        </View>
      </ScrollContainer>
      <Button
        onPress={() =>
          router.push({
            pathname: "/matches/[id]/messages",
            params: { id },
          })
        }
        size="icon"
        className="rounded-full absolute bottom-6 right-6"
      >
        <MessageCircle className="text-foreground" />
      </Button>
    </Fragment>
  );
}
