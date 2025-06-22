import { Pressable, View } from "react-native";
import { Text } from "../ui/text";
import { Zap } from "~/lib/icons/Zap";
import { Button } from "../ui/button";
import { Link, useRouter } from "expo-router";

export default function StartMatchButton() {
  const router = useRouter();

  return (
    <Button
      size="lg"
      className="gap-2 flex flex-row"
      onPress={() => router.push("/matchmaking")}
    >
      <Text className="font-semibold">Start Game</Text>
      <Zap size={24} className="text-foreground" />
    </Button>
  );
}
