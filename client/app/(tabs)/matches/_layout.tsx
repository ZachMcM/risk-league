import { Stack } from "expo-router";
import PageTitle from "~/components/ui/page-title";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: (_) => <PageTitle title="Matches" />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
