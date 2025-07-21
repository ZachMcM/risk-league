import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MessagesList from "~/components/matches/MessagesList";
import { useMessages } from "~/components/providers/MessagesProvider";
import { Container } from "~/components/ui/container";
import { Input } from "~/components/ui/input";
import ModalContainer from "~/components/ui/modal-container";
import { Text } from "~/components/ui/text";

export default function Messages() {
  const insets = useSafeAreaInsets();
  const { sendMessage, isConnected, messagesPending } = useMessages();
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (inputValue.trim() && isConnected) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <ModalContainer>
      <View className="flex flex-1 flex-col">
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
    </ModalContainer>
  );
}
