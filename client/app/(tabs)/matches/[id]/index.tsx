import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment } from "react";
import { ActivityIndicator, View } from "react-native";
import MatchStatsView from "~/components/matches/MatchStatsView";
import { useMatch } from "~/components/providers/MatchProvider";
import { Button } from "~/components/ui/button";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { MessageCircle } from "~/lib/icons/MessageCircle";

export default function Match() {
  const { id } = useLocalSearchParams() as { id: string };
  const { isStatsPending } = useMatch();

  const router = useRouter();

  return (
    <Fragment>
      <ScrollContainer>
        <View className="flex flex-1 flex-col gap-6">
          {isStatsPending ? (
            <ActivityIndicator className="text-foreground" />
          ) : (
            <MatchStatsView />
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
