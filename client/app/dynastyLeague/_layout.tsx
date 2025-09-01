import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="[dynastyLeagueId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
