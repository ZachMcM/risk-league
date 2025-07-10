import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MessagesList from "~/components/matches/MessagesList";
import { useMatch } from "~/components/providers/MatchMessagesProvider";
import { Container } from "~/components/ui/container";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";

export default function Messages() {
  const insets = useSafeAreaInsets();
  const { sendMessage, isConnected } = useMatch();
  const [inputValue, setInputValue] = useState("");

  const { messagesPending } = useMatch();

  const handleSendMessage = () => {
    if (inputValue.trim() && isConnected) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <Container className="p-0">
      <View className="flex-1 flex flex-col gap-8 items-center">
        <View className="rounded-2xl bg-secondary h-2 w-24" />
        {messagesPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          <MessagesList />
        )}
      </View>
      <View
        style={{
          marginBottom: insets.bottom,
        }}
        className="border-t border-border p-6 bg-background flex flex-col gap-3"
      >
        <Input
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleSendMessage}
          editable={isConnected && !messagesPending}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          returnKeyType="send"
        />
        <Text className="text-center text-muted-foreground text-sm">
          Keep it friendly and respectful during your match 😁
        </Text>
      </View>
    </Container>
  );
}
