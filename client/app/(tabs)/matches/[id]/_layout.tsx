import { Stack } from "expo-router";
import { MatchMessagesProvider } from "~/components/providers/MatchMessagesProvider";
import PageTitle from "~/components/ui/page-title";

export default function Layout() {
  return (
    <MatchMessagesProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            header: (_) => <PageTitle title="Match" back />,
          }}
        />
        <Stack.Screen
          name="messages"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
      </Stack>
    </MatchMessagesProvider>
  );
}
