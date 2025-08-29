import { Image } from "expo-image";
import moment from "moment";
import { View } from "react-native";
import { Game } from "~/types/prop";
import { Card, CardContent } from "../ui/card";
import { Text } from "../ui/text";

export default function GameCard({ game }: { game: Game }) {
  return (
    <Card>
      <CardContent className="p-3 flex flex-col gap-2">
        <Text className="text-xs text-muted-foreground text-center">
          Today, {moment(game.startTime).format("h:mm A")}
        </Text>
        <View className="flex flex-col gap-2">
          <View className="flex flex-row items-center gap-2">
            {game.awayTeam.image && (
              <Image
                source={{ uri: game.awayTeam.image }}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
              />
            )}
            <Text className="font-bold text-sm">
              {game.awayTeam.abbreviation}
            </Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            {game.homeTeam.image && (
              <Image
                source={{ uri: game.homeTeam.image }}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
              />
            )}
            <Text className="font-bold text-sm">
              {game.homeTeam.abbreviation}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
