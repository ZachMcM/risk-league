import { Prop } from "~/types/props";
import { useParlayPicks } from "../providers/ParlayProvider";
import { cn, formatCompactNumber, getStatName } from "~/lib/utils";
import { Card, CardContent } from "../ui/card";
import { Text } from "../ui/text";
import { View } from "react-native";
import { Badge } from "../ui/badge";
import moment from "moment";
import { Button } from "../ui/button";

export default function PropCard({ prop, popular }: { prop: Prop; popular?: boolean }) {
  const { isPropPicked, addPick, removePick, updatePick, getPick } =
    useParlayPicks();

  return (
    <Card className={cn("w-[48%]", isPropPicked(prop.id) && "border-primary")}>
      <CardContent className="p-4 flex flex-col items-center gap-4">
        {popular && (
          <Text className="self-end text-xs font-semibold text-muted-foreground">
            🔥 {formatCompactNumber(prop.parlayPicksCount)}
          </Text>
        )}
        <View className="flex flex-col items-center gap-1">
          <View className="flex flex-row items-center gap-2">
            <Badge variant="secondary">
              <Text>{prop.player.team.abbreviation}</Text>
            </Badge>
            <Text className="font-semibold text-muted-foreground text-xs">
              {prop.player.position}
            </Text>
          </View>
          <Text className="font-bold text-lg">{prop.player.name}</Text>
          <Text className="font-semibold text-muted-foreground text-sm">
            {/* TODO */}
            vs ABRV • {moment(prop.gameStartTime).format("ddd h:mm A")}
          </Text>
        </View>
        <View className="flex flex-col items-center">
          <Text className="font-extrabold text-2xl">{prop.line}</Text>
          <Text className="text-muted-foreground">
            {getStatName(prop.stat)}
          </Text>
        </View>
        <View className="flex flex-row items-center justify-center gap-1">
          {prop.pickOptions?.map((option, i) => (
            <Button
              onPress={() => {
                if (isPropPicked(prop.id)) {
                  if (getPick(prop.id) == option) {
                    removePick(prop.id);
                  } else {
                    console.log("update pick");
                    updatePick(prop.id, option);
                  }
                } else {
                  addPick({ prop, pick: option });
                }
              }}
              className={cn(
                "h-10 flex-grow flex-1 flex-row justify-center items-center bg-secondary border border-secondary",
                getPick(prop.id) == option && "border-primary bg-primary/20"
              )}
              size="sm"
              key={`${prop.id}_option_${i}`}
            >
              <Text className="capitalize font-semibold">{option}</Text>
            </Button>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}