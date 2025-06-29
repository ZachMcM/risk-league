import { Link } from "expo-router";
import { View } from "react-native";
import SignUpForm from "~/components/auth/SignUpForm";
import { Container } from "~/components/ui/container";
import { Text } from "~/components/ui/text";

export default function SignUp() {
  return (
    <Container>
      <View className="flex flex-1 w-full justify-center items-center gap-4 p-6">
        <View className="flex flex-col items-center gap-1">
          <Text className="text-4xl font-geist-bold">Sign Up</Text>
          <Text className="text-muted-foreground text-xl font-geist-semibold">
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
    </Container>
  );
}
