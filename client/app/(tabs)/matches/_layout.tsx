import { Stack } from "expo-router";
import FullScreenModalHeader from "~/components/ui/fullscreen-modal-header";
import PageTitle from "~/components/ui/page-title";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: (_) => <PageTitle title="Match History" />,
        }}
      />
      <Stack.Screen
        name="[matchId]"
        options={{
          header: (_) => <FullScreenModalHeader close/>,
          presentation: "fullScreenModal"
        }}
      />
    </Stack>
  );
}
