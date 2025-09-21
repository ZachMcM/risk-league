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

import {
  LEAGUES,
  MIN_PARLAYS_REQUIRED,
  MIN_PCT_TOTAL_STAKED,
  MIN_STAKE_PCT,
  ranksList,
} from "~/lib/config";
import { Separator } from "~/components/ui/separator";
import RankIcon from "../ui/rank-icon";
import { Icon } from "../ui/icon";
import { Minus, MinusCircle } from "lucide-react-native";

export default function ParlaysHelp({
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
              onPress={() => scrollToSection("building")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Blocks className="text-primary" size={20} />
              <Text className="font-semibold text-primary">
                Building Parlays
              </Text>
            </Pressable>
            <Separator />
            <Pressable
              onPress={() => scrollToSection("parlays")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Icon as={MinusCircle} className="text-primary" size={20} />
              <Text className="font-semibold text-primary">Ties</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("building", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Blocks className="text-primary" />
              <Text className="font-bold text-xl">Building Parlays</Text>
            </View>
            <Text className="text-muted-foreground font-semibold">
              Parlays also have some guidelines to ensure fairness.
            </Text>
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
                on every pick of the parlay. You must have at least 3 picks in a
                parlay to chosoe the Flex Play option. The multipliers scale
                with pick count.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Perfect Plays</Text>
              <Text className="text-muted-foreground font-semibold">
                Perfect plays have higher multipliers but require you to hit on
                every pick of the parlay. You must have at least 2 picks in a
                parlay to choose the Flex Play option. The multipliers scale
                with pick count.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Minimum Stake</Text>
              <Text className="text-muted-foreground font-semibold">
                Users must stake {MIN_STAKE_PCT * 100}% of their current balance
                for an individual parlay.
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("ties", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Icon as={MinusCircle} size={24} className="text-primary" />
              <Text className="font-bold text-xl">Ties</Text>
            </View>
            <Text className="text-muted-foreground font-semibold">
              Risk League policy for pick ties
            </Text>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Ties Policy</Text>
              <Text className="text-muted-foreground font-semibold">
                When picks tie, the pick gets voided / doesn't count, so a 4 leg
                parlay now becomes a 3 leg parlay.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Invalid Leg Counts</Text>
              <Text className="text-muted-foreground font-semibold">
                It is possible to have a flex play with less than 3 picks or a
                perfect play with less than 2 picks if multiple picks in the
                parlay are tied. If this is the case the original stake is just
                returned to the user.
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  );
}
