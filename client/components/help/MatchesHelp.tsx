import { Pressable, View } from "react-native";
import { Card, CardContent } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { Clock } from "~/lib/icons/Clock";
import { Dices } from "~/lib/icons/Dices";
import { Gavel } from "~/lib/icons/Gavel";
import { Play } from "~/lib/icons/Play";

import { Separator } from "~/components/ui/separator";
import {
  LEAGUES,
  MIN_PARLAYS_REQUIRED,
  MIN_PCT_TOTAL_STAKED,
  ranksList
} from "~/lib/config";
import RankIcon from "../ui/rank-icon";

export default function MatchesHelp({
  scrollToSection,
  handleSectionLayout,
}: {
  scrollToSection: (sectionKey: string) => void;
  handleSectionLayout: (sectionKey: string, y: number) => void;
}) {
  return (
    <View className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <Text className="font-bold text-xl">Table of Contents</Text>
          <View className="flex flex-col gap-2">
            <Pressable
              onPress={() => scrollToSection("ranks")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Dices className="text-primary" size={20} />
              <Text className="font-semibold text-primary">
                Competitive Ranks
              </Text>
            </Pressable>
            <Separator />
            <Pressable
              onPress={() => scrollToSection("overview")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Dices className="text-primary" size={20} />
              <Text className="font-semibold text-primary">Match Overview</Text>
            </Pressable>
            <Separator />
            <Pressable
              onPress={() => scrollToSection("types")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Play className="text-primary" size={20} />
              <Text className="font-semibold text-primary">Match Types</Text>
            </Pressable>
            <Separator />
            <Pressable
              onPress={() => scrollToSection("guidelines")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Gavel className="text-primary" size={20} />
              <Text className="font-semibold text-primary">
                Match Guidelines
              </Text>
            </Pressable>
            <Separator />
            <Pressable
              onPress={() => scrollToSection("timeline")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Clock className="text-primary" size={20} />
              <Text className="font-semibold text-primary">Match Timeline</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("ranks", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Dices className="text-primary" />
              <Text className="font-bold text-xl">Competitive Ranks</Text>
            </View>
            <Text className="text-muted-foreground font-semibold">
              There are 6 competitive rank tiers. Rookie, Pro, All Star,
              Superstar, Elite, and Legend.
            </Text>
            <Text className="text-muted-foreground font-semibold">
              Each rank except for Legend has 3 level, I, II, and III. Once a
              user has hit legend they are ranked by pure points.
            </Text>
            <View className="flex flex-row items-center gap-4 w-full flex-wrap">
              {ranksList.map((rank) => (
                <View key={`${rank.tier}-${rank.level}`} className="flex flex-col gap-2 items-center">
                  <RankIcon rank={rank} size={48} />
                  <Text className="text-sm font-bold">
                    {rank.tier} {rank.level}
                  </Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("overview", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Dices className="text-primary" />
              <Text className="font-bold text-xl">Match Overview</Text>
            </View>
            <Text className="text-muted-foreground font-semibold">
              Matches are head-to-head competitions where you and an opponent
              compete to build the most profitable parlays using available props
              from live sports events.
            </Text>
          </CardContent>
        </Card>
      </View>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("types", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Play className="text-primary" />
              <Text className="font-bold text-xl">Match Types</Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Leagues</Text>
              <Text className="text-muted-foreground font-semibold">
                You can start a match for the following sports leagues;{" "}
                {LEAGUES.slice(0, -1).join(", ") +
                  ", or " +
                  LEAGUES[LEAGUES.length - 1]}
                .
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Competitive</Text>
              <Text className="text-muted-foreground font-semibold">
                Competitive Matches place you against players of a similar rank
                to you, losing or winning a competitive actually affects your
                rank.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Friendly</Text>
              <Text className="text-muted-foreground font-semibold">
                You can only start Friendly Matches with friends, these matches
                do not count toward your rank.
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("guidelines", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Gavel className="text-primary" />
              <Text className="font-bold text-xl">Match Guidelines</Text>
            </View>
            <Text className="text-muted-foreground font-semibold">
              To incentivize risk and ensure fair play, matches have guidelines
              that users must meet or they will be disqualified.
            </Text>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Minimum Total Staked</Text>
              <Text className="text-muted-foreground font-semibold">
                The total value that a user must stake in a match must be at
                least {MIN_PCT_TOTAL_STAKED * 100}% of the starting balance.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Minimum Parlays</Text>
              <Text className="text-muted-foreground font-semibold">
                Users must make at least {MIN_PARLAYS_REQUIRED} parlays.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Friendly</Text>
              <Text className="text-muted-foreground font-semibold">
                You can only start Friendly Matches with friends, these matches
                do not count toward your rank.
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("timeline", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Clock className="text-primary" />
              <Text className="font-bold text-xl">Match Timeline</Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Match Endings</Text>
              <Text className="text-muted-foreground font-semibold">
                Matches last until all the games for the particular league are
                finished.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">
                Friendly Match Availability
              </Text>
              <Text className="text-muted-foreground font-semibold">
                Friendly match Availability is not based on your previous parlays,
                but available props in general.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">
                Competitive Match Availability
              </Text>
              <Text className="text-muted-foreground font-semibold">
                You can only start competitive matches for sports leagues where
                you have props available. This means match Availability is based
                on your previous parlays for the day, and actual amount of live
                events occurring in that day.
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  );
}
