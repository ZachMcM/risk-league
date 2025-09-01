import { Stack } from "expo-router";
import DynastyLeagueHeader from "~/components/dynasty/DynastyLeagueHeader";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => <DynastyLeagueHeader />,
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
        name="users"
        options={{ headerShown: false, presentation: "modal" }}
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
