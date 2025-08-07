import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import MessagesList from "~/components/matches/MessagesList";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import ModalContainer from "~/components/ui/modal-container";
import { Text } from "~/components/ui/text";
import { getMessages, postMessage } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { Message } from "~/types/match";
import { SendHorizontal } from "~/lib/icons/SendHorizontal";

export default function Messages() {
  const searchParams = useLocalSearchParams<{ matchId: string }>();
  const matchId = parseInt(searchParams.matchId);

  const { data } = authClient.useSession();

  const { data: messages, isPending: areMessagesPending } = useQuery({
    queryKey: ["match", matchId, "messages"],
    queryFn: async () => await getMessages(matchId),
  });

  const queryClient = useQueryClient();

  const { mutate: sendMessage, isPending: isSendingMessagePending } =
    useMutation({
      mutationFn: async ({ content }: { content: string }) =>
        postMessage(matchId, content),
      onMutate: async ({ content }) => {
        await queryClient.cancelQueries({
          queryKey: ["match", matchId, "messages"],
        });

        const previousMessages = queryClient.getQueryData([
          "match",
          matchId,
          "messages",
        ]);
        queryClient.setQueryData(
          ["match", matchId, "messages"],
          (old: Message[]) => [
            ...old,
            {
              id: Math.round(Math.random() * 100),
              content,
              createdAt: new Date().toISOString(),
              userId: data?.user.id,
              matchId,
              user: {
                id: data?.user.id,
                image: data?.user.image,
                username: data?.user.username,
              },
            },
          ]
        );

        return { previousMessages };
      },
      onError: (err, newMessage, context) => {
        console.log(err);
        toast.error("There was an error sending your message");
        queryClient.setQueryData(
          ["match", matchId, "messages"],
          context?.previousMessages
        );
      },
    });

  const insets = useSafeAreaInsets();
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage({ content: inputValue });
      setInputValue("");
    }
  };

  return (
    <ModalContainer>
      <View className="flex flex-1 flex-col">
        {areMessagesPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          messages && <MessagesList messages={messages} />
        )}
      </View>
      <View
        style={{
          marginBottom: insets.bottom,
        }}
        className="border-t border-border p-6 bg-background flex flex-row items-center gap-2"
      >
        <Input
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleSendMessage}
          editable={!areMessagesPending}
          placeholder={!areMessagesPending ? "Type a message..." : "Loading..."}
          returnKeyType="send"
          className="flex-1"
        />
        <Button variant="secondary" size="icon" onPress={handleSendMessage}>
          <SendHorizontal className="text-foreground" size={20} />
        </Button>
      </View>
    </ModalContainer>
  );
}
