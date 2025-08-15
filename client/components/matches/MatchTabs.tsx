import { router } from "expo-router";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { Match } from "~/types/match";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Text } from "../ui/text";
import MatchListCard from "./MatchListCard";
import { FlashList } from "@shopify/flash-list";
import { GridItemWrapper } from "../ui/grid-item-wrapper";

export default function MatchTabs({
  unresolvedMatches,
  resolvedMatches,
}: {
  unresolvedMatches: Match[];
  resolvedMatches: Match[];
}) {
  const [matchStatus, setMatchStatus] = useState(
    unresolvedMatches.length == 0 ? "completed" : "in-progress",
  );

  return (
    <View className="flex flex-1">
      <Tabs
        value={matchStatus}
        onValueChange={setMatchStatus}
        className="flex flex-1 flex-col gap-4"
      >
        <TabsList className="flex-row w-full">
          <TabsTrigger value="in-progress" className="flex-1">
            <Text>In Progress ({unresolvedMatches.length})</Text>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            <Text>Completed ({resolvedMatches.length})</Text>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="in-progress" className="flex-1">
          {unresolvedMatches.length == 0 ? (
            <View className="flex flex-col gap-4 p-4 items-center">
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
              data={unresolvedMatches}
              contentContainerStyle={{
                paddingBottom: 12,
              }}
              estimatedItemSize={166}
              renderItem={({ item, index }) => (
                <GridItemWrapper index={index} numCols={1} gap={12}>
                  <MatchListCard match={item} />
                </GridItemWrapper>
              )}
              keyExtractor={(item) => item.id.toString()}
            />
          )}
        </TabsContent>
        <TabsContent value="completed" className="flex-1">
          {resolvedMatches.length == 0 ? (
            <View className="flex flex-col gap-4 p-4 items-center">
              <View className="flex flex-col gap-1 items-center">
                <Text className="font-bold text-2xl text-center">
                  No completed matches
                </Text>
                <Text className="font-semibold text-muted-foreground text-center max-w-sm">
                  You don't have any matches completed matches currently
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
                paddingBottom: 12,
              }}
              estimatedItemSize={166}
              data={resolvedMatches}
              renderItem={({ item, index }) => (
                <GridItemWrapper index={index} numCols={1} gap={12}>
                  <MatchListCard match={item} />
                </GridItemWrapper>
              )}
              keyExtractor={(item) => item.id.toString()}
            />
          )}
        </TabsContent>
      </Tabs>
    </View>
  );
}
