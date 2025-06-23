import { useLocalSearchParams } from "expo-router";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";

export default function Match() {
  const { id } = useLocalSearchParams()

  return (
    <ScrollContainer>
      <Text>{id}</Text>
    </ScrollContainer>
  )
}