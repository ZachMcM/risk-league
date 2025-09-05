import { Image } from "expo-image";
import moment from "moment";
import { Pressable, View } from "react-native";
import { TodayPlayerProps } from "~/types/prop";
import { cn } from "~/utils/cn";
import { formatName } from "~/utils/stringUtils";
import { useCreateParlay } from "../providers/CreateParlayProvider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import PlayerImage from "../ui/player-image";
import { Text } from "../ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { Icon } from "../ui/icon";
import { ArrowRight } from "lucide-react-native";

export default function PlayerProps({
  playerProps,
}: {
  playerProps: TodayPlayerProps;
}) {
  const {
    isPropPicked,
    addPick,
    removePick,
    updatePick,
    getPickChoice,
    picks,
  } = useCreateParlay();

  const searchParams = useLocalSearchParams<{
    matchId?: string;
    dynastyLeagueId?: string;
  }>();

  return (
    <View className="flex flex-col gap-4 flex-1">
      <View className="flex flex-row w-full justify-between gap-4 items-center">
        <View className="flex flex-col gap-1 flex-1 py-4">
          <View className="flex flex-col">
            <Text className="text-2xl font-semibold flex-wrap">
              {formatName(playerProps.player.name).firstName}
            </Text>
            <Text className="text-4xl font-bold flex-wrap">
              {formatName(playerProps.player.name).lastName}
            </Text>
          </View>
          <Text className="text-muted-foreground text-lg">
            {playerProps.player.team.fullName} • {playerProps.player.position}
          </Text>
        </View>
        <PlayerImage image={playerProps.player.image} className="h-28 w-28" />
      </View>
      {playerProps.games.map((game) => (
        <Card key={game.gameId}>
          <CardContent className="py-4 px-6 flex flex-row items-center justify-between">
            {game.homeTeam.image ? (
              <View className="flex flex-col justify-center items-center gap-1">
                <Image
                  contentFit="contain"
                  source={{
                    uri: game.homeTeam.image,
                  }}
                  style={{ width: 35, height: 35 }}
                />
                <Text className="text-muted-foreground text-xs">
                  {game.homeTeam.abbreviation}
                </Text>
              </View>
            ) : (
              <Badge variant="secondary">
                <Text className="text-sm">{game.homeTeam.abbreviation}</Text>
              </Badge>
            )}
            <Text className="text-muted-foreground text-center max-w-xs text-sm">
              Starts {moment(game.startTime).format("ddd h:mm A")}
            </Text>
            {game.awayTeam.image ? (
              <View className="flex flex-col justify-center items-center gap-1">
                <Image
                  contentFit="contain"
                  source={{
                    uri: game.awayTeam.image,
                  }}
                  style={{ width: 30, height: 30 }}
                />
                <Text className="text-muted-foreground text-xs">
                  {game.awayTeam.abbreviation}
                </Text>
              </View>
            ) : (
              <Badge variant="secondary">
                <Text className="text-sm">{game.awayTeam.abbreviation}</Text>
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
      <Accordion type="multiple" className="flex flex-col gap-4">
        {playerProps.props.map((prop) => (
          <AccordionItem
            key={prop.id}
            value={prop.id.toString()}
            className="border-b-0"
          >
            <Card>
              <CardContent className="p-4">
                <View className="flex flex-row items-center justify-between flex-1">
                  <View className="flex flex-row items-center gap-3">
                    <AccordionTrigger />
                    <View className="flex flex-col">
                      <Text className="font-bold text-2xl">{prop.line}</Text>
                      <Text className="text-muted-foreground">
                        {prop.statDisplayName}
                      </Text>
                    </View>
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
                          "h-10 flex-row justify-center items-center bg-secondary border border-secondary",
                          getPickChoice(prop.id) == choice &&
                            "border-primary bg-primary/20"
                        )}
                        size="sm"
                        key={`${prop.id}_option_${i}`}
                      >
                        <Text className="capitalize font-semibold">
                          {choice}
                        </Text>
                      </Button>
                    ))}
                  </View>
                </View>
                <AccordionContent className="flex flex-1 flex-col gap-3 mt-6">
                  <View className="flex flex-row justify-between items-center relative">
                    <View className="absolute inset-0 h-24 pointer-events-none">
                      <View
                        className="absolute w-full flex flex-row"
                        style={{
                          top: `${
                            100 -
                            (prop.line /
                              Math.max(
                                ...prop.previousResults.map((r) => r.value),
                                prop.line
                              )) *
                              100
                          }%`,
                        }}
                      >
                        {Array.from({ length: 72 }, (_, i) => (
                          <View
                            key={i}
                            className="h-px bg-muted-foreground opacity-60 flex-1 mr-1 z-10"
                            style={{ marginRight: i % 2 === 0 ? 4 : 0 }}
                          />
                        ))}
                      </View>
                      <View className="absolute bottom-0 w-full h-px bg-muted-foreground opacity-40" />
                    </View>
                    {prop.previousResults.map((result, index) => {
                      const isAboveLine = result.value > prop.line;
                      const maxValue = Math.max(
                        ...prop.previousResults.map((r) => r.value),
                        prop.line
                      );
                      const height = (result.value / maxValue) * 100;
                      const gameDate = moment(result.time).format("M/D/YY");

                      return (
                        <View
                          key={index}
                          className="flex flex-col items-center gap-2 flex-1"
                        >
                          <View className="flex flex-col items-center justify-end h-24 relative">
                            <View
                              className={cn(
                                "w-8 rounded-t-md z-50",
                                height !== 0 && "border",
                                isAboveLine
                                  ? "bg-green-950 border-green-700"
                                  : "bg-red-950 border-red-700"
                              )}
                              style={{ height: `${height}%` }}
                            />
                          </View>
                          <View className="flex flex-col">
                            <Text className="text-lg font-semibold text-center">
                              {result.value}
                            </Text>
                            <Text className="!text-sm text-muted-foreground text-center">
                              {gameDate}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                  <View className="flex flex-row items-center justify-center gap-1">
                    <Text className="text-sm text-muted-foreground">
                      {prop.previousResults.length > 0
                        ? (
                            prop.previousResults.reduce(
                              (sum, r) => sum + r.value,
                              0
                            ) / prop.previousResults.length
                          ).toFixed(1)
                        : "0.0"}{" "}
                      avg last {prop.previousResults.length}
                    </Text>
                  </View>
                </AccordionContent>
              </CardContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>
      <Pressable
        className="flex flex-row items-center gap-2 rounded-full self-end"
        onPress={() => {
          router.dismiss();
          if (searchParams.matchId) {
            router.navigate({
              pathname: "/match/[matchId]/props/finalize-parlay",
              params: { matchId: parseInt(searchParams.matchId) },
            });
          } else {
            router.navigate({
              pathname:
                "/dynastyLeague/[dynastyLeagueId]/props/finalize-parlay",
              params: {
                dynastyLeagueId: parseInt(searchParams.dynastyLeagueId!),
              },
            });
          }
        }}
      >
        <Text>View Entries</Text>
        <Icon as={ArrowRight} className="text-foreground" size={16} />
      </Pressable>
    </View>
  );
}
