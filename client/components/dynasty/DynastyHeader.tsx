import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../ui/text";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import { Plus } from "~/lib/icons/Plus";
import { Button } from "../ui/button";

export default function DynastyHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ marginTop: insets.top }}
      className="flex flex-row items-center justify-between p-6"
    >
      <Text className="font-bold text-4xl">Dynasty</Text>
      <Button
        onPress={() => router.navigate("/create-dynasty-league")}
        variant="foreground"
        size="sm"
        className="flex flex-row items-center gap-2 rounded-full h-10"
      >
        <Plus className="text-background" size={18} />
        <Text>Create</Text>
      </Button>
    </View>
  );
}
