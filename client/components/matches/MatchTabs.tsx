import { useState } from "react";
import { View } from "react-native";
import { MatchListEntity, MatchStatus } from "~/types/matches";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Text } from "../ui/text";
import MatchListItem from "./MatchListItem";
import StartMatchButton from "./StartMatchButton";

export default function MatchTabs({ matches }: { matches: MatchListEntity[] }) {
  const [matchStatus, setMatchStatus] = useState("not_resolved");

  function filterMatches(status: MatchStatus) {
    return matches.filter((match) => match.status == status);
  }

  const notResolved = filterMatches("not_resolved");
  const wins = filterMatches("win");
  const losses = filterMatches("loss");

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
            <TabsTrigger value="not_resolved" className="flex-1">
              <Text>In Progress ({notResolved.length})</Text>
            </TabsTrigger>
            <TabsTrigger value="win" className="flex-1">
              <Text>Wins ({wins.length})</Text>
            </TabsTrigger>
            <TabsTrigger value="loss" className="flex-1">
              <Text>Losses ({losses.length})</Text>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="not_resolved">
            {notResolved.length == 0 ? (
              <View className="flex flex-col gap-4">
                <Text className="font-semibold text-xl text-center text-muted-foreground">
                  You have no active matches, lock in!
                </Text>
                <StartMatchButton />
              </View>
            ) : (
              notResolved.map((match) => (
                <MatchListItem key={match.id} match={match} />
              ))
            )}
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
      )}
    </View>
  );
}
