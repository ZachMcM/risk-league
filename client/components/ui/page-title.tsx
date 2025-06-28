import { Href, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import { Text } from "./text";

export default function PageTitle({
  title,
  back,
}: {
  title: string;
  back?: Href;
}) {
  const router = useRouter();

  return (
    <View className="flex flex-row items-center gap-2">
      {back && (
        <Pressable onPress={() => router.push(back)}>
          <ChevronLeft size={32} className="text-foreground" />
        </Pressable>
      )}
      <Text className="font-geist-bold text-4xl">{title}</Text>
    </View>
  );
}
