import { Stack } from "expo-router";
import { MessagesProvider } from "~/components/providers/MessagesProvider";
import {
  ParlayPickerFooter,
  ParlayProvider,
} from "~/components/providers/ParlayProvider";

export default function Layout() {
  return (
    <MessagesProvider>
      <ParlayProvider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
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
