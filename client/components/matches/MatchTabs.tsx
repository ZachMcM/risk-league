import { useState } from "react";
import { View } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Text } from "../ui/text";
import MatchListItem from "./MatchListItem";
import StartMatchButton from "./StartMatchButton";
import { Match } from "~/types/matches";

export default function MatchTabs({ matches }: { matches: Match[] }) {
  const [matchStatus, setMatchStatus] = useState("in_progress");

  function filterMatches(status: boolean) {
    return matches.filter((match) => match.resolved == status);
  }

  const completed = filterMatches(true);
  const inProgress = filterMatches(false);

  return (
    <View className="flex flex-1">
      {matches.length == 0 ? (
        <View className="flex flex-col gap-4">
          <Text className="font-semibold text-xl text-center text-muted-foreground">
            You have no matches, lock in!
          </Text>
          <StartMatchButton />
        </View>
      ) : (
        <Tabs
          value={matchStatus}
          onValueChange={setMatchStatus}
          className="flex-col gap-4"
        >
          <TabsList className="flex-row w-full">
            <TabsTrigger value="in_progress" className="flex-1">
              <Text>In Progress ({inProgress.length})</Text>
            </TabsTrigger>
            <TabsTrigger value="loss" className="flex-1">
              <Text>Completed ({completed.length})</Text>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="in_progress">
            {inProgress.length == 0 ? (
              <View className="flex flex-col gap-4">
                <Text className="font-semibold text-xl text-center text-muted-foreground">
                  You have no active matches, lock in!
                </Text>
                <StartMatchButton />
              </View>
            ) : (
              inProgress.map((match) => (
                <MatchListItem key={match.id} match={match} />
              ))
            )}
          </TabsContent>
          <TabsContent value="completed">
            {completed.map((match) => (
              <MatchListItem key={match.id} match={match} />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </View>
  );
}
