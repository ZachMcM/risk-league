import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { Pressable, View } from "react-native";
import { Prop } from "~/types/prop";
import { cn } from "~/utils/cn";
import { useCreateParlay } from "../providers/CreateParlayProvider";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Text } from "../ui/text";
import { Badge } from "../ui/badge";

export default function PropCard({ prop }: { prop: Prop }) {
  const searchParams = useLocalSearchParams() as { matchId: string };
  const matchId = parseInt(searchParams.matchId);

  const { isPropPicked, addPick, removePick, updatePick, getPickChoice } =
    useCreateParlay();

  // Safety check for essential prop data
  if (!prop.player?.name || !prop.line || !prop.choices) {
    return null;
  }

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/match/[matchId]/players/[playerId]",
          params: { matchId, playerId: prop.playerId },
        })
      }
      className="flex-1"
    >
      <Card className={cn("flex-1", isPropPicked(prop.id) && "border-primary")}>
        <CardContent className="p-4 flex flex-col items-center gap-4">
          <View className="flex flex-col items-center gap-1">
            <View className="flex flex-row items-center gap-2">
              <Badge variant="secondary">
                <Text>{prop.player.team.abbreviation}</Text>
              </Badge>
              <Text className="font-semibold text-muted-foreground text-xs">
                {prop.player.position}
              </Text>
            </View>
            <Text className="font-bold text-lg text-center">
              {prop.player.name}
            </Text>
            <Text className="font-semibold text-muted-foreground text-sm text-center">
              {prop.game.homeTeamId == prop.player.teamId
                ? `@ ${
                    prop.game.awayTeam.abbreviation ??
                    prop.game.awayTeam.fullName
                  }`
                : `vs ${
                    prop.game.homeTeam.abbreviation ??
                    prop.game.homeTeam.fullName
                  }`}{" "}
              • {moment(prop.game.startTime).format("ddd h:mm A")}
            </Text>
          </View>
          <View className="flex flex-col items-center">
            <Text className="font-extrabold text-2xl">{prop.line}</Text>
            <Text className="text-muted-foreground">
              {prop.statDisplayName}
            </Text>
          </View>
          <View className="flex flex-row items-center justify-center gap-1">
            {prop.choices.map((choice, i) => (
              <Button
                onPress={() => {
                  if (isPropPicked(prop.id)) {
                    if (getPickChoice(prop.id) == choice) {
                      removePick(prop.id);
                    } else {
                      console.log("update pick");
                      updatePick(prop.id, choice);
                    }
                  } else {
                    addPick({ prop, choice });
                  }
                }}
                className={cn(
                  "h-10 flex-grow flex-1 flex-row justify-center items-center bg-secondary border border-secondary",
                  getPickChoice(prop.id) == choice &&
                    "border-primary bg-primary/20"
                )}
                size="sm"
                key={`${prop.id}_option_${i}`}
              >
                <Text className="capitalize font-semibold">{choice}</Text>
              </Button>
            ))}
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}
