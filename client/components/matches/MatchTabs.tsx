import { useState } from "react";
import { View } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Text } from "../ui/text";
import { Match } from "~/types/match";
import MatchListCard from "./MatchListCard";

export default function MatchTabs({ matches }: { matches: Match[] }) {
  const completed = filterMatches(true);
  const inProgress = filterMatches(false);

  const [matchStatus, setMatchStatus] = useState(inProgress.length == 0 ? "completed" : "in-progress");

  function filterMatches(status: boolean) {
    return matches.filter((match) => match.resolved == status);
  }

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
          {inProgress.map((match) => (
            <MatchListCard key={match.id} match={match} />
          ))}
        </TabsContent>
        <TabsContent value="completed" className="flex flex-col gap-4">
          {completed.map((match) => (
            <MatchListCard key={match.id} match={match} />
          ))}
        </TabsContent>
      </Tabs>
    </View>
  );
}
