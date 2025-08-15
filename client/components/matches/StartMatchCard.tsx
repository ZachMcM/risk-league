import { Image, ImageSource } from "expo-image";
import { ReactNode } from "react";
import { View } from "react-native";
import { Play } from "~/lib/icons/Play";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import LeagueLogo from "../ui/league-logos/LeagueLogo";
import { Text } from "../ui/text";
import MatchmakingDialog from "./MatchmakingDialog";
import { League } from "~/lib/constants";

export default function StartMatchCard({
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

  return (
    <Card className="w-[48%] self-stretch">
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
          <View className="flex flex-row items-center gap-2">
            <LeagueLogo size={28} league={league} />
            <Text className="font-extrabold text-2xl uppercase">{league}</Text>
          </View>
          <MatchmakingDialog league={league}>
            <Button className="flex flex-row items-center gap-2">
              <Play className="text-foreground" size={18} />
              <Text className="font-bold">Start Match</Text>
            </Button>
          </MatchmakingDialog>
        </View>
      </CardContent>
    </Card>
  );
}
