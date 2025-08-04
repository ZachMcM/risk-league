import { View } from "react-native";
import { getFlexMultiplierTable } from "~/lib/utils";
import { Text } from "../ui/text";

export default function FlexPlayOutcomes({
  length,
  stake,
}: {
  length: number;
  stake: number | null;
}) {
  return getFlexMultiplierTable(length).map(({ hits, multiplier }) => (
    <View key={hits} className="flex flex-row items-center justify-between">
      <View className="flex flex-row items-center gap-2">
        <Text className="font-semibold text-lg">
          {hits} out of {length} Correct
        </Text>
        <View className="bg-primary/20 py-1 px-2 rounded-lg">
          <Text className="font-semibold text-primary">
            {multiplier.toFixed(2)}x
          </Text>
        </View>
      </View>
      <Text className="font-semibold text-lg">
        ${stake && (stake * multiplier).toFixed(2)}
      </Text>
    </View>
  ));
}
