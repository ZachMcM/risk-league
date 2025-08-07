import { Stack } from "expo-router";
import {
  ParlayPickerFooter,
  ParlayProvider,
} from "~/components/providers/ParlayProvider";
import PageTitle from "~/components/ui/page-title";

export default function Layout() {
  return (
    <ParlayProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            header: () => <PageTitle title="Match" back />,
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
  );
}
