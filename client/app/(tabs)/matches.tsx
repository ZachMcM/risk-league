import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import BannerAdWrapper from "~/components/ad-wrappers/Banner";
import MatchListCard from "~/components/matches/MatchListCard";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { GridItemWrapper } from "~/components/ui/grid-item-wrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import { getMatchIds } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function Matches() {
  const { data: currentUserData } = authClient.useSession();

  const { data: unresolvedMatchIds, isPending: unresolvedMatchesPending } =
    useQuery({
      queryKey: ["match-ids", currentUserData?.user.id, "unresolved"],
      queryFn: async () => await getMatchIds(false),
    });

  const { data: resolvedMatchIds, isPending: resolvedMatchesPending } =
    useQuery({
      queryKey: ["match-ids", currentUserData?.user.id, "resolved"],
      queryFn: async () => await getMatchIds(true),
    });

  const [matchStatus, setMatchStatus] = useState(
    unresolvedMatchIds?.length == 0 ? "completed" : "in-progress"
  );

  return (
    <Container className="p-0 flex flex-col gap-6">
      <BannerAdWrapper />
      <Tabs
        value={matchStatus}
        onValueChange={setMatchStatus}
        className="flex flex-1 flex-col"
      >
        <TabsList>
          <TabsTrigger value="in-progress">
            <Text>In Progress ({unresolvedMatchIds?.length})</Text>
          </TabsTrigger>
          <TabsTrigger value="completed">
            <Text>Completed ({resolvedMatchIds?.length})</Text>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="in-progress" className="flex-1">
          {unresolvedMatchesPending ? (
            <ActivityIndicator className="text-foreground p-8" />
          ) : !unresolvedMatchIds || unresolvedMatchIds.length == 0 ? (
            <View className="flex flex-col gap-4 p-8 items-center">
              <View className="flex flex-col gap-1 items-center">
                <Text className="font-bold text-2xl text-center">
                  No matches in progress
                </Text>
                <Text className="font-semibold text-muted-foreground text-center max-w-sm">
                  You don't have any matches in progress currently
                </Text>
              </View>
              <Button
                size="sm"
                variant="foreground"
                onPress={() => router.navigate("/(tabs)")}
              >
                <Text>Start a Match</Text>
              </Button>
            </View>
          ) : (
            <FlashList
              showsVerticalScrollIndicator={false}
              data={unresolvedMatchIds}
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingVertical: 16,
              }}
              estimatedItemSize={166}
              renderItem={({ item, index }) => (
                <GridItemWrapper index={index} numCols={1} gap={16}>
                  <MatchListCard matchId={item} />
                </GridItemWrapper>
              )}
              keyExtractor={(item) => item.toString()}
            />
          )}
        </TabsContent>
        <TabsContent value="completed" className="flex-1">
          {resolvedMatchesPending ? (
            <ActivityIndicator className="text-foreground p-8" />
          ) : !resolvedMatchIds || resolvedMatchIds.length == 0 ? (
            <View className="flex flex-col gap-4 p-8 items-center">
              <View className="flex flex-col gap-1 items-center">
                <Text className="font-bold text-2xl text-center">
                  No completed matches
                </Text>
                <Text className="font-semibold text-muted-foreground text-center max-w-sm">
                  You don't have any completed matches currently
                </Text>
              </View>
              <Button
                size="sm"
                variant="foreground"
                onPress={() => router.navigate("/(tabs)")}
              >
                <Text>Start a Match</Text>
              </Button>
            </View>
          ) : (
            <FlashList
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingVertical: 16,
              }}
              estimatedItemSize={166}
              data={resolvedMatchIds}
              renderItem={({ item, index }) => (
                <GridItemWrapper index={index} numCols={1} gap={16}>
                  <MatchListCard matchId={item} />
                </GridItemWrapper>
              )}
              keyExtractor={(item) => item.toString()}
            />
          )}
        </TabsContent>
      </Tabs>
    </Container>
  );
}
