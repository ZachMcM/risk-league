import { View } from "react-native";
import { TodayPlayerProps } from "~/types/prop";
import { Text } from "../ui/text";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import moment from "moment";
import { useCreateParlay } from "../providers/CreateParlayProvider";
import { Button } from "../ui/button";
import { cn } from "~/utils/cn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import PlayerImage from "../ui/player-image";

export default function PlayerProps({
  playerProps,
}: {
  playerProps: TodayPlayerProps;
}) {
  const { isPropPicked, addPick, removePick, updatePick, getPickChoice } =
    useCreateParlay();

  console.log(playerProps.props[0].previousResults);

  return (
    <View className="flex flex-col gap-4">
      <View className="flex flex-row w-full justify-between gap-4 items-end border-b border-border">
        <View className="flex flex-col gap-1 flex-1 py-4">
          <Text className="text-4xl font-bold flex-wrap">
            {playerProps.player.name}
          </Text>
          <Text className="text-muted-foreground text-lg">
            {playerProps.player.team.fullName} • {playerProps.player.position}
          </Text>
        </View>
        <PlayerImage image={playerProps.player.image} scale={2} />
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
                  style={{ width: 35, height: 35 }}
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
                  <View className="flex flex-row items-center gap-4">
                    <AccordionTrigger />
                    <View className="flex flex-col">
                      <Text className="font-bold text-3xl">{prop.line}</Text>
                      <Text className="text-lg">{prop.statDisplayName}</Text>
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
                <AccordionContent>
                  <View className="flex flex-col gap-3 mt-6">
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
                  </View>
                </AccordionContent>
              </CardContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>
    </View>
  );
}
