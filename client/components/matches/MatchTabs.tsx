import { useState } from "react";
import { View } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Text } from "../ui/text";
import { Match } from "~/types/match";
import MatchListCard from "./MatchListCard";
import { Button } from "../ui/button";
import { router } from "expo-router";

export default function MatchTabs({ matches }: { matches: Match[] }) {
  function filterMatches(status: boolean) {
    return matches.filter((match) => match.resolved == status);
  }

  const completed = filterMatches(true);
  const inProgress = filterMatches(false);

  console.log(matches);
  console.log(completed);
  console.log(inProgress);

  const [matchStatus, setMatchStatus] = useState(
    inProgress.length == 0 ? "completed" : "in-progress"
  );

  return (
    <View className="flex flex-1">
      <Tabs
        value={matchStatus}
        onValueChange={setMatchStatus}
        className="flex-col gap-4"
      >
        <TabsList className="flex-row w-full">
          <TabsTrigger value="in-progress" className="flex-1">
            <Text>In Progress ({inProgress.length})</Text>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            <Text>Completed ({completed.length})</Text>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="in-progress" className="flex flex-col gap-4">
          {inProgress.length == 0 ? (
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
            inProgress.map((match) => (
              <MatchListCard key={match.id} match={match} />
            ))
          )}
        </TabsContent>
        <TabsContent value="completed" className="flex flex-col gap-4">
          {completed.length == 0 ? (
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
            completed.map((match) => (
              <MatchListCard key={match.id} match={match} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </View>
  );
}
