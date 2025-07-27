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

  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  const leagues = [
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
    if (selectedLeague) {
      router.navigate({
        pathname: "/matchmaking/[id]",
        params: { id: selectedLeague },
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
            {leagues.length > 0 ? (
              leagues.map((league) => (
                <Pressable
                  key={league.id}
                  className={cn(
                    "flex flex-row items-center gap-2 border-2 border-border py-2 px-4 rounded-xl",
                    selectedLeague == league.id &&
                      "border-primary bg-primary/20",
                    !isActive(league.id) && "opacity-70"
                  )}
                  onPress={() => {
                    if (isActive(league.id)) {
                      setSelectedLeague(league.id);
                    }
                  }}
                >
                  {league.icon}
                  <Text className="text-lg font-bold">{league.name}</Text>
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
          disabled={selectedLeague == null}
          onPress={handleStartGame}
          size="lg"
          className="flex flex-row items-center gap-4"
        >
          <Play className="text-white" />
          <Text className="font-bold !text-xl">
            {selectedLeague == null
              ? "Select Game Mode"
              : `Start ${
                  leagues.find((league) => league.id == selectedLeague)
                    ?.name
                } Match`}
          </Text>
        </Button>
      </CardContent>
    </Card>
  );
}
