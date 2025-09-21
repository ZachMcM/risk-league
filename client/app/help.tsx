import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Text } from "~/components/ui/text";

import MatchesHelp from "~/components/help/MatchesHelp";
import ModalContainer from "~/components/ui/modal-container";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import DynastyHelp from "~/components/help/DynastyHelp";
import ParlaysHelp from "~/components/help/ParlaysHelp";

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
      <ScrollContainer className="pt-10 px-0" ref={scrollViewRef}>
        <View className="flex flex-col gap-4">
          <Text className="font-bold text-4xl pb-4 px-4">Help</Text>
          <Tabs
            value={tab}
            onValueChange={setTab}
            className="flex flex-col gap-4"
          >
            <TabsList>
              <TabsTrigger value="matches">
                <Text>Matches</Text>
              </TabsTrigger>
              <TabsTrigger value="parlays">
                <Text>Parlays</Text>
              </TabsTrigger>
              <TabsTrigger value="dynasty">
                <Text>Dynasty</Text>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="matches" className="px-4 pt-4">
              <MatchesHelp
                handleSectionLayout={handleSectionLayout}
                scrollToSection={scrollToSection}
              />
            </TabsContent>
            <TabsContent value="parlays" className="px-4 pt-4">
              <ParlaysHelp
                handleSectionLayout={handleSectionLayout}
                scrollToSection={scrollToSection}
              />
            </TabsContent>
            <TabsContent value="dynasty" className="px-4 pt-4">
              <DynastyHelp
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
