import { View } from "react-native";
import Matchmaking from "~/components/matchmaking/Matchmaking";
import { Container } from "~/components/ui/container";

export default function MatchMaking() {
  return (
    <Container>
      <View className="flex flex-1 justify-center items-center">
        <Matchmaking />
      </View>
    </Container>
  );
}
