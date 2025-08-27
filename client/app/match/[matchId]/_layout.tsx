import { Stack } from "expo-router";
import MatchHeader from "~/components/matches/MatchHeader";
import { CreateParlayProvider } from "~/components/providers/CreateParlayProvider";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => <MatchHeader />,
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
        name="parlays/[parlayId]"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="props"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
