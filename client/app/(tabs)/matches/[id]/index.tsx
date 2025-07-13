import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment } from "react";
import { ActivityIndicator, View } from "react-native";
import MatchDetails from "~/components/matches/MatchDetails";
import { Button } from "~/components/ui/button";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { getMatch } from "~/endpoints";
import { MessageCircle } from "~/lib/icons/MessageCircle";

export default function Match() {
  const searchParams = useLocalSearchParams() as { id: string };
  const id = parseInt(searchParams.id);

  const router = useRouter();

  const { data: match, isPending: isMatchPending } = useQuery({
    queryKey: ["match", id],
    queryFn: async () => await getMatch(id),
  });

  return (
    <Fragment>
      <ScrollContainer>
        {isMatchPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          match && (
            <View className="flex flex-col flex-1 gap-10">
              <MatchDetails match={match} />
            </View>
          )
        )}
      </ScrollContainer>
      <Button
        onPress={() =>
          router.push({
            pathname: "/matches/[id]/messages",
            params: { id },
          })
        }
        size="icon"
        className="rounded-full absolute bottom-2 right-2"
      >
        <MessageCircle className="text-white" />
      </Button>
    </Fragment>
  );
}
