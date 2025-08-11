import moment from "moment";
import { View } from "react-native";
import { Prop } from "~/types/prop";
import { cn } from "~/utils/cn";
import { useParlay } from "../providers/ParlayProvider";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Text } from "../ui/text";

export default function PropCard({ prop }: { prop: Prop }) {
  const { isPropPicked, addPick, removePick, updatePick, getPickChoice } =
    useParlay();

  // Safety check for essential prop data
  if (!prop.player?.name || !prop.line || !prop.choices) {
    return null;
  }

  return (
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
            {
              prop.game.homeTeamId == prop.player.teamId ? `@ ${prop.game.awayTeam.abbreviation}` : `vs ${prop.game.homeTeam.abbreviation}`
            } •{" "}
            {moment(prop.game.startTime).format("ddd h:mm A")}
          </Text>
        </View>
        <View className="flex flex-col items-center">
          <Text className="font-extrabold text-2xl">{prop.line}</Text>
          <Text className="text-muted-foreground">{prop.statDisplayName}</Text>
        </View>
        <View className="flex flex-row items-center justify-center gap-1">
          {prop.choices?.map((choice, i) => (
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
  );
}
