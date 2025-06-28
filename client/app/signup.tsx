import { Link, Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import SignUpForm from "~/components/auth/SignUpForm";
import { useSession } from "~/components/providers/SessionProvider";
import { Card } from "~/components/ui/card";
import { Container } from "~/components/ui/container";
import { Text } from "~/components/ui/text";

export default function SignUp() {
  const { session, isSessionPending } = useSession();

  return (
    <Container>
      {isSessionPending ? (
        <View className="flex flex-1 justify-center items-center">
          <ActivityIndicator className="text-foreground" />
        </View>
      ) : session ? (
        <Redirect href="/(tabs)" />
      ) : (
        <View className="flex flex-1 w-full justify-center items-center gap-4 p-6">
          <View className="flex flex-col items-center gap-1">
            <Text className="text-5xl font-geist-bold">Sign Up</Text>
            <Text className="text-muted-foreground text-xl">
              Create a Risk League account
            </Text>
          </View>
          <SignUpForm />
          <Text className="text-center text-lg">
            Already have an account? Sign in{" "}
            <Link push className="underline" href="/signin">
              here.
            </Link>
          </Text>
        </View>
      )}
    </Container>
  );
}
