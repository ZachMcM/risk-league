import { Stack } from "expo-router";
import FullScreenModalHeader from "~/components/ui/fullscreen-modal-header";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="[matchId]"
        options={{
          header: (_) => <FullScreenModalHeader close/>,
        }}
      />
    </Stack>
  );
}
