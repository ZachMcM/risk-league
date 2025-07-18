import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import MatchDetails from "~/components/matches/MatchDetails";
import PropsView from "~/components/props/PropsView";
import { Button } from "~/components/ui/button";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import { getMatch, getAllProps } from "~/endpoints";
import { MessageCircle } from "~/lib/icons/MessageCircle";

export default function Match() {
  const searchParams = useLocalSearchParams<{ id: string }>();
  const id = parseInt(searchParams.id);

  const router = useRouter();

  const { data: match, isPending: isMatchPending } = useQuery({
    queryKey: ["match", id],
    queryFn: async () => await getMatch(id),
  });

  const { data: props, isPending: isPropsPending } = useQuery({
    queryKey: ["props"],
    queryFn: async () => await getAllProps(match?.gameMode!),
    enabled: !!match,
  });

  const [tabsValue, setTabsValue] = useState("props");

  return (
    <Fragment>
      <ScrollContainer>
        {isMatchPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          match && (
            <View className="flex flex-col flex-1 gap-8">
              <MatchDetails match={match} />
              <Tabs
                value={tabsValue}
                onValueChange={setTabsValue}
                className="flex-col gap-4"
              >
                <TabsList className="flex-row w-full">
                  <TabsTrigger value="props" className="flex-1">
                    <Text>Props</Text>
                  </TabsTrigger>
                  <TabsTrigger value="parlays" className="flex-1">
                    <Text>Parlays</Text>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="props">
                  {isPropsPending ? (
                    <ActivityIndicator className="text-foreground" />
                  ) : (
                    props && <PropsView props={props} />
                  )}
                </TabsContent>
                <TabsContent value="parlays"></TabsContent>
              </Tabs>
            </View>
          )
        )}
      </ScrollContainer>
      <Button
        onPress={() =>
          router.navigate({
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
