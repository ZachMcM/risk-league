import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { View } from "react-native";
import { getPick } from "~/endpoints";
import { ArrowDown } from "~/lib/icons/ArrowDown";
import { ArrowUp } from "~/lib/icons/ArrowUp";
import { Check } from "~/lib/icons/Check";
import { X } from "~/lib/icons/X";
import { Pick } from "~/types/parlay";
import { cn } from "~/utils/cn";
import { Card, CardContent } from "../ui/card";
import PlayerImage from "../ui/player-image";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";
import { Jersey } from "../jersey";

export default function PickCard({ initialData }: { initialData: Pick }) {
  const { data: pick } = useQuery({
    initialData,
    queryKey: ["pick", initialData.id],
    queryFn: async () => await getPick(initialData.id),
  });

  return !pick || !pick.prop || !pick.prop.player || !pick.prop.game ? (
    <Card className="w-full h-[177px] border animate-pulse" />
  ) : (
    <Card key={pick.id}>
      <CardContent className="p-4 flex flex-col gap-4">
        <View className="flex flex-row items-center gap-2">
          {pick.prop.game.startTime <= new Date().toISOString() &&
            !pick.prop.resolved &&
            pick.status === "not_resolved" && (
              <View className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
            )}
          <Text className="text-muted-foreground">
            {pick.prop.game.awayTeam.abbreviation} @{" "}
            {pick.prop.game.homeTeam.abbreviation} •{" "}
            {moment(pick.prop.game.startTime).format("h:mm A")}
          </Text>
        </View>
        <Separator />
        <View className="flex flex-row items-center gap-4">
          {/* <PlayerImage
            className={cn(
              "w-16 h-16",
              pick.status == "hit"
                ? "border-success"
                : pick.status == "missed"
                ? "border-destructive"
                : "border-border"
            )}
            image={pick.prop.player.image}
          /> */}
          <Jersey
            league={pick.prop.player.league}
            jerseyNumber={pick.prop.player.number}
            color={`#${pick.prop.player.team.color ?? "000000"}`}
            alternateColor={`#${pick.prop.player.team.alternateColor ?? "FFFFFF"}`}
            teamName={pick.prop.player.team.abbreviation ?? ""}
            size={64}
          />
          <View className="flex flex-col gap-3 flex-1">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-col gap-1">
                <View className="flex flex-row items-center gap-1">
                  <Text className="font-bold">{pick.prop.player.name}</Text>
                  <Text className="text-muted-foreground font-semibold">
                    • {pick.prop.player.position}
                  </Text>
                </View>
                <View className="flex flex-row items-center gap-1">
                  {pick.choice == "over" ? (
                    <ArrowUp size={18} className="text-foreground" />
                  ) : (
                    <ArrowDown size={18} className="text-foreground" />
                  )}
                  <Text className="font-semibold">
                    {pick.prop.line} {pick.prop.statDisplayName}
                  </Text>
                </View>
              </View>
              {pick.status == "tie" ? (
                <Text className="font-semibold text-lg uppercase">TIE</Text>
              ) : pick.status == "did_not_play" ? (
                <Text className="font-semibold text-lg uppercase">DNP</Text>
              ) : (
                <View
                  className={cn(
                    "h-6 w-6 border-2 border-border rounded-full flex justify-center items-center",
                    pick.status === "hit" && "bg-success border-success",
                    pick.status === "missed" &&
                      "bg-destructive border-destructive"
                  )}
                >
                  {pick.status != "not_resolved" &&
                    (pick.status == "hit" ? (
                      <Check
                        strokeWidth={3}
                        size={16}
                        className="text-foreground"
                      />
                    ) : (
                      pick.status == "missed" && (
                        <X
                          strokeWidth={3}
                          size={16}
                          className="text-foreground"
                        />
                      )
                    ))}
                </View>
              )}
            </View>
            <Progress
              value={pick.prop.currentValue}
              max={pick.prop.line}
              showValueText
              className="h-2.5 w-full"
              variant={
                pick.status == "hit"
                  ? "success"
                  : pick.status == "missed"
                  ? "destructive"
                  : "default"
              }
            />
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
