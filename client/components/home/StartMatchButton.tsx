import { useRouter } from "expo-router";
import { Zap } from "~/lib/icons/Zap";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

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
