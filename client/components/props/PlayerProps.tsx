import { Image } from "expo-image";
import moment from "moment";
import { Pressable, View } from "react-native";
import { Prop, TodayPlayerProps } from "~/types/prop";
import { cn } from "~/utils/cn";
import { formatName } from "~/utils/stringUtils";
import { useCreateParlay } from "../providers/CreateParlayProvider";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import PlayerImage from "../ui/player-image";
import { Text } from "../ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { Icon } from "../ui/icon";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import LeagueLogo from "../ui/league-logo";
import { BaseballJersey, FootballJersey, Jersey } from "../jersey";
import { lightenColor } from "~/utils/colorUtils";

function PropAccordion({
  prop,
}: {
  prop: Prop & {
    previousResults: {
      time: string;
      value: number;
    }[];
  };
}) {
  const [expanded, setExpanded] = useState(false);

  const {
    isPropPicked,
    addPick,
    removePick,
    updatePick,
    getPickChoice,
    picks,
  } = useCreateParlay();

  return (
    <Card className="flex-1">
      <CardContent className="p-4 flex flx-col gap-4">
        <View className="flex flex-row items-center justify-between flex-1">
          <View className="flex flex-row items-center gap-3">
            <Pressable
              onPress={() =>
                expanded ? setExpanded(false) : setExpanded(true)
              }
            >
              <Icon
                as={expanded ? ChevronUp : ChevronDown}
                className="text-foreground"
                size={18}
              />
            </Pressable>
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
                <Text className="capitalize font-semibold">{choice}</Text>
              </Button>
            ))}
          </View>
        </View>
        {expanded && (
          <View className="flex flex-col gap-3">
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
                      <Text className="text-sm text-muted-foreground text-center">
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
        )}
      </CardContent>
    </Card>
  );
}

export default function PlayerProps({
  playerProps,
}: {
  playerProps: TodayPlayerProps;
}) {
  const searchParams = useLocalSearchParams<{
    matchId?: string;
    dynastyLeagueId?: string;
  }>();

  return (
    <View className="flex flex-col gap-4 flex-1">
      <View className="flex flex-row w-full justify-between gap-4 items-center">
        <View className="flex flex-col gap-1 flex-1 py-4">
          <View className="flex flex-col gap-1.5">
            <Text className="text-3xl font-semibold flex-wrap">
              {formatName(playerProps.player.name).firstName}
            </Text>
            <Text className="text-5xl font-bold flex-wrap">
              {formatName(playerProps.player.name).lastName}
            </Text>
          </View>
          <Text className="text-muted-foreground text-lg">
            {playerProps.player.team.fullName} • {playerProps.player.position}
          </Text>
        </View>
        {/* <PlayerImage image={playerProps.player.image} className="h-28 w-28" /> */}
        <Jersey
          league={playerProps.player.league}
          jerseyNumber={playerProps.player.number}
          color={`#${playerProps.player.team.color}`}
          alternateColor={`#${playerProps.player.team.alternateColor}`}
          size={128}
          teamName={playerProps.player.team.abbreviation ?? ""}
        />
      </View>
      {playerProps.games.map((game) => (
        <Card key={game.gameId}>
          <CardContent
            className={cn(
              "p-4 flex items-center justify-between",
              playerProps.player.teamId !== game.homeTeamId
                ? "flex-row-reverse"
                : "flex-row"
            )}
          >
            <View
              className={cn(
                "flex items-center gap-3",
                playerProps.player.teamId !== game.homeTeamId
                  ? "flex-row-reverse"
                  : "flex-row"
              )}
            >
              <View
                style={{
                  backgroundColor: `#${game.homeTeam.color}`,
                  borderWidth: 2,
                  borderColor: lightenColor(game.homeTeam.color!, 0.2),
                }}
                className={cn(
                  "flex flex-col justify-center items-center h-12 w-12 rounded-full"
                )}
              >
                <Text className="tracking-tighter text-center font-semibold text-sm">
                  {game.homeTeam.abbreviation}
                </Text>
              </View>
              <Text>{game.homeTeam.mascot}</Text>
            </View>
            <Text className="text-muted-foreground text-center text-sm flex-grow">
              Starts {moment(game.startTime).format("h:mm A")}
            </Text>
            <View
              className={cn(
                "flex items-center gap-3",
                playerProps.player.teamId !== game.homeTeamId
                  ? "flex-row-reverse"
                  : "flex-row"
              )}
            >
              <Text>{game.awayTeam.mascot}</Text>
              <View
                style={{
                  backgroundColor: `#${game.awayTeam.color}`,
                  borderWidth: 2,
                  borderColor: lightenColor(game.awayTeam.color!, 0.2),
                }}
                className={cn(
                  "flex flex-col justify-center items-center h-12 w-12 rounded-full"
                )}
              >
                <Text className="tracking-tighter text-center font-semibold text-sm">
                  {game.awayTeam.abbreviation}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      ))}
      <View className="flex flex-col gap-4">
        {playerProps.props.map((prop) => (
          <PropAccordion key={prop.id} prop={prop} />
        ))}
      </View>
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
