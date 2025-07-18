import { Stack } from "expo-router";
import { MatchProvider } from "~/components/providers/MatchProvider";
import PageTitle from "~/components/ui/page-title";

export default function Layout() {
  return (
    <MatchProvider>
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
      </Stack>
    </MatchProvider>
  );
}
