import { Stack } from "expo-router";
import FullScreenModalHeader from "~/components/ui/fullscreen-modal-header";
import PageTitle from "~/components/ui/page-title";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="[matchId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
