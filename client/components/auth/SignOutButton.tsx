import { ActivityIndicator } from "react-native";
import { Text } from "../ui/text";
import { authClient } from "~/lib/auth-client";
import { Button } from "../ui/button";
import { router } from "expo-router";

export default function SignOutButton() {
  const { isPending } = authClient.useSession();
  async function signOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.navigate("/")
        }
      }
    })
  }

  return (
    <Button
      variant="secondary"
      onPress={signOut}
      size="lg"
      className="flex-row gap-2 items-center"
    >
      <Text>Sign Out</Text>
      {isPending && <ActivityIndicator className="text-foreground" />}
    </Button>
  );
}
