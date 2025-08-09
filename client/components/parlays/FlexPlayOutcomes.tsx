import { View } from "react-native";
import { Text } from "../ui/text";
import { getFlexMultiplierTable } from "~/utils/multiplierUtils";
import { FlatList } from "react-native-gesture-handler";

export default function FlexPlayOutcomes({
  length,
  stake,
}: {
  length: number;
  stake: number | null;
}) {
  return getFlexMultiplierTable(length).map(({ hits, multiplier }) => (
    <FlexOutcomeItem length={length} stake={stake} hits={hits} multiplier={multiplier} />
  ));
}

function FlexOutcomeItem({
  hits,
  multiplier,
  stake,
  length
}: {
  hits: number;
  multiplier: number;
  stake: number | null;
  length: number
}) {
  return (
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
  );
}
