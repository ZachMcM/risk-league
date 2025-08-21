import { Image, ImageSource } from "expo-image";
import { ReactNode } from "react";
import { View } from "react-native";
import { Play } from "~/lib/icons/Play";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import LeagueLogo from "../ui/league-logos/LeagueLogo";
import { Text } from "../ui/text";
import MatchmakingDialog from "./MatchmakingDialog";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "~/lib/auth-client";
import { getTodayProps } from "~/endpoints";
import { cn } from "~/utils/cn";
import { League } from "~/lib/config";

export default function PlayCard({
  league,
}: {
  league: League;
  children?: ReactNode;
}) {
  const mlbImage = require("~/assets/images/mlb.jpeg");
  const nbaImage = require("~/assets/images/nba.jpeg");
  const nflImage = require("~/assets/images/nfl.jpeg");
  const ncaabbImage = require("~/assets/images/ncaabb.jpeg");
  const ncaafbImage = require("~/assets/images/ncaafb.jpeg");

  const { data } = authClient.useSession();

  const { data: props, isPending: arePropsPending } = useQuery({
    queryKey: ["props", league, data?.user.id, "competitive"],
    queryFn: async () => await getTodayProps(league, true),
    staleTime: 1440 * 60 * 1000,
  });

  return (
    <Card
      className={cn(
        "w-[48%] self-stretch",
        (arePropsPending || props == undefined || props.length == 0) &&
          "opacity-40"
      )}
    >
      <CardContent className="p-0 flex-1 flex flex-col">
        <View className={"relative overflow-hidden h-32"}>
          <Image
            contentFit="cover"
            source={
              league == "MLB"
                ? mlbImage
                : league == "NBA"
                ? nbaImage
                : league == "NFL"
                ? nflImage
                : league == "NCAAFB"
                ? ncaafbImage
                : ncaabbImage
            }
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <View className="flex flex-col justify-between gap-3 p-4 flex-1">
          <View className="flex flex-col gap-1">
            <View className="flex flex-row items-center gap-2">
              <LeagueLogo size={28} league={league} />
              <Text className="font-extrabold text-2xl uppercase">
                {league}
              </Text>
            </View>
            <Text className="text-muted-foreground">
              {arePropsPending ? "..." : props?.length} Props Available
            </Text>
          </View>
          <MatchmakingDialog
            disableTrigger={arePropsPending || !props || props.length == 0}
            league={league}
          >
            <Button className="flex flex-row items-center gap-2">
              <Text className="font-bold">Play</Text>
              <Play className="text-foreground" size={16} />
            </Button>
          </MatchmakingDialog>
        </View>
      </CardContent>
    </Card>
  );
}
