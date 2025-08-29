import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import { Text } from "./text";

export default function PageHeader({
  title,
}: {
  title: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ marginTop: insets.top }}
      className="flex flex-row items-center gap-2 p-4"
    >
      <Text className="font-bold text-4xl">{title}</Text>
    </View>
  );
}
