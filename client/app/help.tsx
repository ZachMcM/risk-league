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
import { Separator } from "~/components/ui/separator";
import ModalContainer from "~/components/ui/modal-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import MatchesHelp from "~/components/help/MatchesHelp";

export default function Help() {
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

  const [tab, setTab] = useState("matches");

  return (
    <ModalContainer>
      <ScrollContainer className="pt-10" ref={scrollViewRef}>
        <View className="flex flex-col gap-4">
          <Text className="font-bold text-4xl">Help</Text>
          <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-4">
            <TabsList className="flex-row self-start">
              <TabsTrigger value="matches" className="flex-1">
                <Text>Matches</Text>
              </TabsTrigger>
              <TabsTrigger value="dynasty" className="flex-1">
                <Text>Dynasty</Text>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="matches">
              <MatchesHelp
                handleSectionLayout={handleSectionLayout}
                scrollToSection={scrollToSection}
              />
            </TabsContent>
          </Tabs>
        </View>
      </ScrollContainer>
    </ModalContainer>
  );
}
