import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import moment from "moment";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { getTodayGames } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { League } from "~/lib/config";
import { Game } from "~/types/prop";
import { Card, CardContent } from "../ui/card";
import { Text } from "../ui/text";
import { Skeleton } from "../ui/skeleton";

function GameCard({ game }: { game: Game }) {
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
              {game.awayTeam.abbreviation || game.awayTeam.mascot}
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
              {game.homeTeam.abbreviation || game.homeTeam.mascot}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

export default function GamesList({ league }: { league: League }) {
  const { data: games, isPending: areGamesPending } = useQuery({
    queryKey: ["games", "today", league],
    queryFn: async () => await getTodayGames(league),
    staleTime: 1440 * 60 * 1000,
  });

  return (
    <View className="w-full">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ display: "flex", gap: 8 }}
      >
        {areGamesPending ? (
          Array(10).fill("").map(_ => <Skeleton className="rounded-2xl h-24 w-28"/>)
        ) : (
          games?.map((game) => <GameCard key={game.gameId} game={game} />)
        )}
      </ScrollView>
    </View>
  );
}
