import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "lucide-react-native";
import { MessagesProvider } from "~/components/providers/MessagesProvider";
import {
  ParlayPickerFooter,
  ParlayProvider,
} from "~/components/providers/ParlayProvider";
import CardHeader from "~/components/ui/fullscreen-modal-header";
import PageTitle from "~/components/ui/page-title";

export default function Layout() {
  const { matchId } = useLocalSearchParams() as { matchId: string };

  return (
    <MessagesProvider>
      <ParlayProvider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              header: (_) => <PageTitle title="Match" back="/(tabs)/matches" />,
            }}
          />
          <Stack.Screen
            name="messages"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="finalize-parlay"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="parlays/[parlayId]"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
        </Stack>
        <ParlayPickerFooter />
      </ParlayProvider>
    </MessagesProvider>
  );
}
