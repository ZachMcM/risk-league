import { ActivityIndicator } from "react-native";
import { useSession } from "../providers/SessionProvider";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export default function SignOutButton() {
  const { signOut, isSignOutPending } = useSession()

  return (
    <Button onPress={signOut} size="lg">
      <Text>Sign Out</Text>
      {
        isSignOutPending && <ActivityIndicator className="text-foreground"/>
      }
    </Button>
  )
}