import { useRouter } from "expo-router";
import { Button } from "../ui/button";
import { Text } from "../ui/text";
import { Card, CardContent } from "../ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../ui/collapsible";
import { useState } from "react";
import { ChevronDown } from "~/lib/icons/ChevronDown";
import { View, Pressable, ScrollView } from "react-native";
import { NBAIcon } from "../ui/nba-icon";
import { MLBIcon } from "../ui/mlb-icon";
import { Play } from "~/lib/icons/Play";
import { cn } from "~/lib/utils";

export default function StartMatchButton({
  activeLeagues,
}: {
  activeLeagues: string[];
}) {
  const router = useRouter();

  const [selectedGameMode, setSelectedGameMode] = useState<string | null>(null);

  const gameModes = [
    {
      id: "nba",
      name: "NBA",
      icon: <NBAIcon height={20} width={20} />,
    },
    {
      id: "mlb",
      name: "MLB",
      icon: <MLBIcon height={20} width={20} />,
    },
  ];

  const handleStartGame = () => {
    if (selectedGameMode) {
      router.navigate({
        pathname: "/matchmaking/[id]",
        params: { id: selectedGameMode },
      });
    }
  };

  console.log(activeLeagues);

  const isActive = (id: string) => {
    const league = activeLeagues.find((league) => id == league);
    return league != undefined;
  };

  return (
    <Card>
      <CardContent className="p-6 flex flex-col gap-8">
        <View className="flex flex-col gap-4">
          <Text className="text-center text-muted-foreground font-semibold">
            START A MATCH
          </Text>
          <ScrollView
            contentContainerStyle={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 12,
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {gameModes.length > 0 ? (
              gameModes.map((gameMode) => (
                <Pressable
                  key={gameMode.id}
                  className={cn(
                    "flex flex-row items-center gap-2 border-2 border-border py-2 px-4 rounded-xl",
                    selectedGameMode == gameMode.id &&
                      "border-primary bg-primary/20",
                    !isActive(gameMode.id) && "opacity-70"
                  )}
                  onPress={() => {
                    if (isActive(gameMode.id)) {
                      setSelectedGameMode(gameMode.id);
                    }
                  }}
                >
                  {gameMode.icon}
                  <Text className="text-lg font-bold">{gameMode.name}</Text>
                </Pressable>
              ))
            ) : (
              <Text className="font-bold text-xl text-center">
                No Games Today 🥺 Come back tommorow!
              </Text>
            )}
          </ScrollView>
        </View>
        <Button
          disabled={selectedGameMode == null}
          onPress={handleStartGame}
          size="lg"
          className="flex flex-row items-center gap-4"
        >
          <Play className="text-white" />
          <Text className="font-bold !text-xl">
            {selectedGameMode == null
              ? "Select Game Mode"
              : `Start ${
                  gameModes.find((gameMode) => gameMode.id == selectedGameMode)
                    ?.name
                } Match`}
          </Text>
        </Button>
      </CardContent>
    </Card>
  );
}
