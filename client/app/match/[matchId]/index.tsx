import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MatchDetails from "~/components/matches/MatchDetails";
import ParlaysView from "~/components/parlays/ParlaysView";
import PropsView from "~/components/props/PropsView";
import { Button } from "~/components/ui/button";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import { getMatch, getParlays, getTodayProps } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { MessageCircle } from "~/lib/icons/MessageCircle";

export default function Match() {
  const searchParams = useLocalSearchParams<{ matchId: string }>();
  const matchId = parseInt(searchParams.matchId);
  const { data } = authClient.useSession();

  const router = useRouter();

  const { data: match, isPending: isMatchPending } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => await getMatch(matchId),
  });

  const { data: props, isPending: arePropsPending } = useQuery({
    queryKey: ["props", matchId, data?.user.id],
    queryFn: async () => await getTodayProps(match?.league!),
    enabled: !!match,
  });

  const { data: parlays, isPending: areParlaysPending } = useQuery({
    queryKey: ["parlays", matchId, data?.user.id!],
    queryFn: async () => await getParlays(matchId),
  });

  const [tabsValue, setTabsValue] = useState("parlays");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setTabsValue("parlays");
  }, [match?.resolved]);

  return (
    <Fragment>
      <ScrollContainer className="pb-32">
        {isMatchPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          match && (
            <View
              className="flex flex-col flex-1 gap-8"
              style={{
                marginBottom: insets.bottom,
              }}
            >
              <MatchDetails match={match} />
              <Tabs
                value={tabsValue}
                onValueChange={setTabsValue}
                className="flex-col gap-4"
              >
                {!match.resolved && (
                  <TabsList className="flex-row w-full">
                    <TabsTrigger value="parlays" className="flex-1">
                      <Text>Parlays</Text>
                    </TabsTrigger>
                    <TabsTrigger value="props" className="flex-1">
                      <Text>Props</Text>
                    </TabsTrigger>
                  </TabsList>
                )}
                <TabsContent value="props">
                  {arePropsPending ? (
                    <View className="p-2">
                      <ActivityIndicator className="text-foreground" />
                    </View>
                  ) : (
                    props &&
                    (props.length == 0 && !match.resolved ? (
                      <View className="flex flex-col gap-4 p-4 items-center">
                        <View className="flex flex-col gap-1 items-center">
                          <Text className="font-bold text-2xl text-center">
                            No props to bet on
                          </Text>
                          <Text className="font-semibold text-muted-foreground text-center">
                            All games are in progress, there is nothing left to
                            bet on. Good luck!
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <PropsView props={props} league={match.league} />
                    ))
                  )}
                </TabsContent>
                <TabsContent value="parlays">
                  {areParlaysPending ? (
                    <View className="p-2">
                      <ActivityIndicator className="text-foreground" />
                    </View>
                  ) : (
                    parlays &&
                    (parlays.length == 0 && !match.resolved ? (
                      <View className="flex flex-col gap-4 p-4 items-center">
                        <View className="flex flex-col gap-1 items-center">
                          <Text className="font-bold text-2xl text-center">
                            No parlays
                          </Text>
                          <Text className="font-semibold text-muted-foreground text-center">
                            You haven't created any parlays yet, get on it!
                          </Text>
                        </View>
                        <Button
                          size="sm"
                          variant="foreground"
                          onPress={() => setTabsValue("props")}
                          className="self-center"
                        >
                          <Text>Create Parlay</Text>
                        </Button>
                      </View>
                    ) : (
                      <View className="flex flex-1 flex-col gap-6 w-full flex-shrink-0">
                        <ParlaysView
                          parlays={parlays}
                          resolved={match.resolved}
                        />
                      </View>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </View>
          )
        )}
      </ScrollContainer>
      <Button
        onPress={() =>
          router.navigate({
            pathname: "/match/[matchId]/messages",
            params: { matchId },
          })
        }
        size="icon"
        className="rounded-full absolute bottom-6 right-6"
      >
        <MessageCircle className="text-white" />
      </Button>
    </Fragment>
  );
}
