import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { Pressable, View } from "react-native";
import { Prop } from "~/types/prop";
import { cn } from "~/utils/cn";
import { formatName } from "~/utils/stringUtils";
import { useCreateParlay } from "../providers/CreateParlayProvider";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import PlayerImage from "../ui/player-image";
import { Text } from "../ui/text";

export default function PropCard({ prop }: { prop: Prop }) {
  const searchParams = useLocalSearchParams() as {
    matchId?: string;
    dynastyLeagueId?: string;
  };

  const { isPropPicked, addPick, removePick, updatePick, getPickChoice } =
    useCreateParlay();

  return (
    <Pressable
      onPress={() => {
        if (searchParams.matchId) {
          router.navigate({
            pathname: "/match/[matchId]/props/players/[playerId]",
            params: { matchId: searchParams.matchId, playerId: prop.playerId },
          });
        } else if (searchParams.dynastyLeagueId) {
          router.navigate({
            pathname:
              "/dynastyLeague/[dynastyLeagueId]/props/players/[playerId]",
            params: {
              dynastyLeagueId: searchParams.dynastyLeagueId,
              playerId: prop.playerId,
            },
          });
        }
      }}
      className="flex-1"
    >
      <Card
        className={cn(
          "flex-1 overflow-hidden",
          isPropPicked(prop.id) && "border-primary"
        )}
      >
        {/* <CardContent className="px-4 pt-2 pb-4 flex flex-col gap-2.5">
          <View className="flex flex-col gap-1">
            <View className="flex flex-col items-center justify-center">
              <PlayerImage image={prop.player.image} className="h-20 w-20" />
            </View>
            <Text className="font-bold text-center">
              <Text className="text-muted-foreground">
                {prop.player.position} •{" "}
              </Text>
              {formatName(prop.player.name).firstName[0]}.{" "}
              {formatName(prop.player.name).lastName}{" "}
            </Text>
            <Text className="text-muted-foreground text-sm text-center font-normal">
              {prop.game.homeTeamId == prop.player.teamId
                ? `@ ${
                    prop.game.awayTeam.abbreviation ??
                    prop.game.awayTeam.fullName
                  }`
                : `vs ${
                    prop.game.homeTeam.abbreviation ??
                    prop.game.homeTeam.fullName
                  }`}{" "}
              • {moment(prop.game.startTime).format("ddd h:mm A")}
            </Text>
          </View>
          <View className="flex flex-col items-center">
            <Text className="font-bold text-2xl">{prop.line}</Text>
            <Text className="text-muted-foreground text-center">
              {prop.statDisplayName}
            </Text>
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
                  "h-10 flex-grow flex-1 flex-row justify-center items-center bg-secondary border border-secondary",
                  getPickChoice(prop.id) == choice &&
                    "border-primary bg-primary/20"
                )}
                size="sm"
                key={`${prop.id}_option_${i}`}
              >
                <Text className="capitalize">{choice}</Text>
              </Button>
            ))}
          </View>
        </CardContent> */}
        <CardContent className="px-4 py-3 flex flex-row items-center justify-between">
          <View className="flex flex-col gap-1">
            <Text className="font-bold">
              {formatName(prop.player.name).firstName[0]}.{" "}
              {formatName(prop.player.name).lastName}
              <Text className="text-muted-foreground">
                {" • "}
                {prop.player.position}
              </Text>
            </Text>
            <Text className="font-semibold text-muted-foreground text-sm">
              {prop.game.homeTeamId == prop.player.teamId
                ? `@ ${
                    prop.game.awayTeam.abbreviation ??
                    prop.game.awayTeam.fullName
                  }`
                : `vs ${
                    prop.game.homeTeam.abbreviation ??
                    prop.game.homeTeam.fullName
                  }`}{" "}
              • {moment(prop.game.startTime).format("ddd h:mm A")}
            </Text>
            <Text className="font-bold">
              {prop.line} {prop.statDisplayName}
            </Text>
          </View>
          <View className="flex flex-col gap-2">
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
                  "w-20 flex-row justify-center items-center bg-secondary border border-border",
                  getPickChoice(prop.id) == choice &&
                    "border-primary bg-primary/20"
                )}
                key={`${prop.id}_option_${i}`}
                size="sm"
              >
                <Text className="capitalize font-semibold">{choice}</Text>
              </Button>
            ))}
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}
