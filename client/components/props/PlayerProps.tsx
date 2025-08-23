import { View } from "react-native";
import { TodayPlayerProps } from "~/types/prop";
import { Text } from "../ui/text";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { formatDate } from "~/utils/dateUtils";

export default function PlayerProps({
  playerProps,
}: {
  playerProps: TodayPlayerProps;
}) {
  return (
    <View className="flex flex-col gap-6">
      <View className="flex flex-row w-full justify-between gap-4 items-end">
        <View className="flex flex-col gap-1 flex-1">
          <Text className="text-4xl font-bold flex-wrap">
            {playerProps.player.name}
          </Text>
          <Text className="text-muted-foreground text-lg">
            {playerProps.player.team.fullName} • {playerProps.player.position}
          </Text>
        </View>
        {/* Player image goes here */}
      </View>
      {playerProps.games.map((game) => (
        <Card key={game.gameId}>
          <CardContent className="p-4 flex flex-col gap-4">
            <View className=" flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-3">
                <Badge variant="foreground">
                  <Text className="text-sm">{game.homeTeam.abbreviation}</Text>
                </Badge>
                <Text className="font-semibold text-lg">
                  {game.homeTeam.mascot}
                </Text>
              </View>
              <View className="px-2 py-1 bg-primary rounded-full flex flex-row items-center justify-center">
                <Text className="font-bold">vs</Text>
              </View>
              <View className="flex flex-row items-center gap-3">
                <Text className="font-semibold text-lg">
                  {game.awayTeam.mascot}
                </Text>
                <Badge variant="foreground">
                  <Text className="text-sm">{game.awayTeam.abbreviation}</Text>
                </Badge>
              </View>
              <Text className="text-muted-foreground">
                {formatDate(game.startTime)}
              </Text>
            </View>
          </CardContent>
        </Card>
      ))}
    </View>
  );
}
