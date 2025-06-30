import { useState } from "react";
import { View } from "react-native";
import { MatchListEntity, MatchStatus } from "~/types/matches";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Text } from "../ui/text";
import MatchListItem from "./MatchListItem";

export default function MatchTabs({ matches }: { matches: MatchListEntity[] }) {
  const [matchStatus, setMatchStatus] = useState("in_progress");

  function filterMatches(status: MatchStatus) {
    return matches.filter((match) => match.status == status);
  }

  const inProgress = filterMatches("in_progress");
  const wins = filterMatches("win");
  const losses = filterMatches("loss");

  return (
    <View className="flex flex-1">
      <Tabs
        value={matchStatus}
        onValueChange={setMatchStatus}
        className="flex-col gap-4"
      >
        <TabsList className="flex-row w-full">
          <TabsTrigger value="in_progress" className="flex-1">
            <Text>In Progress ({inProgress.length})</Text>
          </TabsTrigger>
          <TabsTrigger value="win" className="flex-1">
            <Text>Wins ({wins.length})</Text>
          </TabsTrigger>
          <TabsTrigger value="loss" className="flex-1">
            <Text>Losses ({losses.length})</Text>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="in_progress">
          {inProgress.map((match) => (
            <MatchListItem key={match.id} match={match} />
          ))}
        </TabsContent>
        <TabsContent value="win">
          {wins.map((match) => (
            <MatchListItem key={match.id} match={match} />
          ))}
        </TabsContent>
        <TabsContent value="loss">
          {losses.map((match) => (
            <MatchListItem key={match.id} match={match} />
          ))}
        </TabsContent>
      </Tabs>
    </View>
  );
}
