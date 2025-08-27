import { router, Stack } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CreateParlayFooter,
  CreateParlayProvider,
} from "~/components/providers/CreateParlayProvider";
import { Text } from "~/components/ui/text";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";

function PropsHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex flex-row items-center gap-2 px-3 py-4"
      style={{
        marginTop: insets.top,
      }}
    >
      <Pressable onPress={() => router.back()}>
        <ChevronLeft size={20} className="text-foreground" />
      </Pressable>
      <Text className="text-xl font-bold">Available Props</Text>
    </View>
  );
}

export default function Layout() {
  return (
    <CreateParlayProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            header: () => <PropsHeader />,
          }}
        />
        <Stack.Screen
          name="finalize-parlay"
          options={{
            presentation: "modal",
            headerShown: false
          }}
        />
        <Stack.Screen
          name="players/[playerId]"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
      </Stack>
      <CreateParlayFooter />
    </CreateParlayProvider>
  );
}
