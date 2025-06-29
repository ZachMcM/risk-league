import { ActivityIndicator } from "react-native";
import { useSession } from "../providers/SessionProvider";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export default function SignOutButton() {
  const { signOut, isSignOutPending } = useSession();

  return (
    <Button variant="secondary" onPress={signOut} size="lg" className="flex-row gap-2 items-center">
      <Text>Sign Out</Text>
      {isSignOutPending && <ActivityIndicator className="text-foreground" />}
    </Button>
  );
}
