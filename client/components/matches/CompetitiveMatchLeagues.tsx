import { ScrollView, View } from "react-native";
import { LEAGUES } from "~/lib/config";
import { Text } from "../ui/text";
import PlayButton from "./PlayButton";

export default function CompetitiveMatchLeagues() {
  return (
    <View className="flex flex-col gap-4 w-full">
      <Text className="text-3xl font-bold">Competitive</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          display: "flex",
          gap: 12,
          paddingRight: 16,
        }}
      >
        {LEAGUES.map((league) => (
          <PlayButton key={league} league={league} />
        ))}
      </ScrollView>
    </View>
  );
}
