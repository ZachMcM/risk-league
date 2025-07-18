import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Container } from "~/components/ui/container";

export default function Players() {
  const searchParams = useLocalSearchParams<{
    player: string;
    currentPropId?: string;
  }>();

  const player = parseInt(searchParams.player);

  const curretnPropId = !searchParams.currentPropId
    ? undefined
    : parseInt(searchParams.currentPropId);

  const insets = useSafeAreaInsets();

  // TODO add endpoint to get all player props and do something based on what prop was 

  return (
    <Container className="p-0">
      <View
        className="flex-1 flex flex-col gap-8 items-center"
        style={{
          marginBottom: insets.bottom,
        }}
      >
        <View className="rounded-2xl bg-secondary h-2 w-24" />
      </View>
    </Container>
  );
}
