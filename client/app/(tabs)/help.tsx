import { useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, CardContent } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { Blocks } from "~/lib/icons/Blocks";
import { Clock } from "~/lib/icons/Clock";
import { Dices } from "~/lib/icons/Dices";
import { Gavel } from "~/lib/icons/Gavel";
import { Play } from "~/lib/icons/Play";

import { ScrollContainer } from "~/components/ui/scroll-container";
import {
  LEAGUES,
  MIN_PARLAYS_REQUIRED,
  MIN_PCT_TOTAL_STAKED,
  MIN_STAKE_PCT,
} from "~/lib/config";

export default function Help() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [sectionPositions, setSectionPositions] = useState<{
    [key: string]: number;
  }>({});

  const scrollToSection = (sectionKey: string) => {
    const position = sectionPositions[sectionKey];
    if (position !== undefined) {
      scrollViewRef.current?.scrollTo({ y: position - 20, animated: true });
    }
  };

  const handleSectionLayout = (sectionKey: string, y: number) => {
    setSectionPositions((prev) => ({ ...prev, [sectionKey]: y }));
  };

  return (
    <ScrollContainer ref={scrollViewRef}>
      <View className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <Text className="font-bold text-2xl">Table of Contents</Text>
            <View className="flex flex-col gap-2">
              <Pressable
                onPress={() => scrollToSection("overview")}
                className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
              >
                <Dices className="text-primary" size={20} />
                <Text className="font-semibold text-primary">
                  Match Overview
                </Text>
              </Pressable>
              <Pressable
                onPress={() => scrollToSection("types")}
                className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
              >
                <Play className="text-primary" size={20} />
                <Text className="font-semibold text-primary">Match Types</Text>
              </Pressable>
              <Pressable
                onPress={() => scrollToSection("guidelines")}
                className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
              >
                <Gavel className="text-primary" size={20} />
                <Text className="font-semibold text-primary">
                  Match Guidelines
                </Text>
              </Pressable>
              <Pressable
                onPress={() => scrollToSection("parlays")}
                className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
              >
                <Blocks className="text-primary" size={20} />
                <Text className="font-semibold text-primary">
                  Building Parlays
                </Text>
              </Pressable>
              <Pressable
                onPress={() => scrollToSection("timeline")}
                className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
              >
                <Clock className="text-primary" size={20} />
                <Text className="font-semibold text-primary">
                  Match Timeline
                </Text>
              </Pressable>
            </View>
          </CardContent>
        </Card>
        <View
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            handleSectionLayout("overview", y);
          }}
        >
          <Card>
            <CardContent className="flex flex-col gap-6 p-6">
              <View className="flex flex-row items-center gap-2">
                <Dices className="text-primary" />
                <Text className="font-bold text-2xl">Match Overview</Text>
              </View>
              <Text className="text-xl text-muted-foreground font-semibold">
                Matches are head-to-head competitions where you and an opponent
                compete to build the most profitable parlays using available
                props from live sports events.
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
            <CardContent className="flex flex-col gap-6 p-6">
              <View className="flex flex-row items-center gap-2">
                <Play className="text-primary" />
                <Text className="font-bold text-2xl">Match Types</Text>
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
                  Competitive Matches place you against players of a similar
                  rank to you, losing or winning a competitive actually affects
                  your rank.
                </Text>
              </View>
              <View className="flex flex-col gap-1">
                <Text className="font-bold text-xl">Friendly</Text>
                <Text className="text-muted-foreground font-semibold">
                  You can only start Friendly Matches with friends, these
                  matches do not count toward your rank.
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
            <CardContent className="flex flex-col gap-6 p-6">
              <View className="flex flex-row items-center gap-2">
                <Gavel className="text-primary" />
                <Text className="font-bold text-2xl">Match Guidelines</Text>
              </View>
              <Text className="text-xl text-muted-foreground font-semibold">
                To incentive risk and ensure fair play, matches have guidelines
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
                  You can only start Friendly Matches with friends, these
                  matches do not count toward your rank.
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>
        <View
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            handleSectionLayout("parlays", y);
          }}
        >
          <Card>
            <CardContent className="flex flex-col gap-6 p-6">
              <View className="flex flex-row items-center gap-2">
                <Blocks className="text-primary" />
                <Text className="font-bold text-2xl">Building Parlays</Text>
              </View>
              <Text className="text-xl text-muted-foreground font-semibold">
                Parlays also have some guidelines to ensure fairness.
              </Text>
              <View className="flex flex-col gap-1">
                <Text className="font-bold text-xl">Prop Guidelines</Text>
                <Text className="text-muted-foreground font-semibold">
                  Once you bet on a player prop in one competitive match, you
                  cannot bet on that same prop in other matches. Bet wisely!
                </Text>
              </View>
              <View className="flex flex-col gap-1">
                <Text className="font-bold text-xl">Max Parlay Picks</Text>
                <Text className="text-muted-foreground font-semibold">
                  An individual parlay can have at most 6 picks.
                </Text>
              </View>
              <View className="flex flex-col gap-1">
                <Text className="font-bold text-xl">Flex Plays</Text>
                <Text className="text-muted-foreground font-semibold">
                  Flex plays have lower multipliers but don't require you to hit
                  on every pick of the parlay. You must have at least 3 picks in
                  a parlay to chosoe the Flex Play option. The multipliers scale
                  with pick count.
                </Text>
              </View>
              <View className="flex flex-col gap-1">
                <Text className="font-bold text-xl">Perfect Plays</Text>
                <Text className="text-muted-foreground font-semibold">
                  Perfect plays have higher multipliers but require you to hit
                  on every pick of the parlay. You must have at least 2 picks in
                  a parlay to choose the Flex Play option. The multipliers scale
                  with pick count.
                </Text>
              </View>
              <View className="flex flex-col gap-1">
                <Text className="font-bold text-xl">Minimum Stake</Text>
                <Text className="text-muted-foreground font-semibold">
                  Users must stake {MIN_STAKE_PCT * 100}% of their current
                  balance for an individual parlay.
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
            <CardContent className="flex flex-col gap-6 p-6">
              <View className="flex flex-row items-center gap-2">
                <Clock className="text-primary" />
                <Text className="font-bold text-2xl">Match Timeline</Text>
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
                  Friendly Match Avaibility
                </Text>
                <Text className="text-muted-foreground font-semibold">
                  Friendly match avaibility is not based on your previous
                  parlays, but available props in general.
                </Text>
              </View>
              <View className="flex flex-col gap-1">
                <Text className="font-bold text-xl">
                  Competitive Match Availability
                </Text>
                <Text className="text-muted-foreground font-semibold">
                  You can only start competitive matches for sports leagues
                  where you have props available. This means match avaibility is
                  based on your previous parlays for the day, and actual amount
                  of live events occurring in that day.
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>
      </View>
    </ScrollContainer>
  );
}
