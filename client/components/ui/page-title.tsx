import { Href, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import { Text } from "./text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PageTitle({
  title,
  back,
}: {
  title: string;
  back?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back()
  };

  return (
    <View
      style={{ marginTop: insets.top }}
      className="flex flex-row items-center gap-2 p-4"
    >
      {back && (
        <Pressable onPress={handleBack}>
          <ChevronLeft size={32} className="text-foreground" />
        </Pressable>
      )}
      <Text className="font-bold text-4xl">{title}</Text>
    </View>
  );
}
