import PageContent from "@/components/common/PageContent";
import { useSession } from "@/components/providers/SessionProvider";
import { Redirect } from "expo-router";
import { KeyboardAvoidingView, ScrollView, Text, View } from "react-native";

export default function SignUp() {
  const { session, isSessionPending } = useSession();

  return isSessionPending ? (
    <View>
      <Text>Loading...</Text>
    </View>
  ) : !session ? (
    <PageContent>
      <Text>Sign Up</Text>
    </PageContent>
  ) : (
    <Redirect href="/(tabs)" />
  );
}
