import { Link, Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import SignInForm from "~/components/auth/SignInForm";
import { useSession } from "~/components/providers/SessionProvider";
import { Container } from "~/components/ui/container";
import { Text } from "~/components/ui/text";

export default function SignIn() {
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
            <Text className="text-5xl font-bold">Sign In</Text>
            <Text className="text-muted-foreground text-xl">
              Sign in to your Risk League account
            </Text>
          </View>
          <SignInForm />
          <Text className="text-center text-lg">
            Don't have an account? Sign Up{" "}
            <Link push className="underline" href="/signup">
              here.
            </Link>
          </Text>
        </View>
      )}
    </Container>
  );
}
