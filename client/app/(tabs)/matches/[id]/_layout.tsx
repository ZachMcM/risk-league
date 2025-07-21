import { Stack } from "expo-router";
import { MessagesProvider } from "~/components/providers/MessagesProvider";
import { ParlayPickerFooter, ParlayProvider } from "~/components/providers/ParlayProvider";
import PageTitle from "~/components/ui/page-title";

export default function Layout() {
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
            name="players/[id]"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="finalize-parlay"
            options={{
              headerShown: false,
              presentation: "modal"
            }}
          />
        </Stack>
        <ParlayPickerFooter/>
      </ParlayProvider>
    </MessagesProvider>
  );
}
