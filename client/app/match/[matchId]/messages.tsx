import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import MessagesList from "~/components/messages/MessagesList";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import ModalContainer from "~/components/ui/modal-container";
import ProfileImage from "~/components/ui/profile-image";
import { Text } from "~/components/ui/text";
import { getMatch, getMessages, postMessage } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { SendHorizontal } from "~/lib/icons/SendHorizontal";
import { ExtendedMatchUser } from "~/types/match";
import { Message } from "~/types/message";

export default function Messages() {
  const searchParams = useLocalSearchParams<{ matchId: string }>();
  const matchId = parseInt(searchParams.matchId);

  const { data: currentUserData } = authClient.useSession();

  const { data: match } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => await getMatch(matchId),
  });

  const { data: messages, isPending: areMessagesPending } = useQuery({
    queryKey: ["match", matchId, "messages"],
    queryFn: async () => await getMessages({ matchId }),
  });

  const queryClient = useQueryClient();

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ content }: { content: string }) =>
      postMessage({ content, matchId }),
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
          ...(old || []),
          {
            id: Math.round(Math.random() * 100),
            content,
            createdAt: new Date().toISOString(),
            userId: currentUserData?.user.id,
            matchId,
            user: {
              id: currentUserData?.user.id,
              image: currentUserData?.user.image,
              username: currentUserData?.user.username,
            },
          },
        ]
      );

      return { previousMessages };
    },
    onError: (err, _, context) => {
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

  const otherMatchUser = match?.matchUsers.find(
    (mu: ExtendedMatchUser) => mu.userId !== currentUserData?.user.id
  )!;

  return (
    <ModalContainer>
      <View className="flex flex-1">
        {areMessagesPending ? (
          <ActivityIndicator className="text-foreground p-4" />
        ) : (
          messages &&
          (messages.length == 0 ? (
            <View className="flex flex-col gap-4 px-4 py-8 items-center">
              <View className="flex flex-col gap-4 items-center">
                <View className="flex flex-col gap-1 items-center">
                  <ProfileImage
                    className="h-20 w-20"
                    username={otherMatchUser.user.username}
                    image={otherMatchUser.user.image}
                  />
                  <Text className="font-bold text-xl text-center">
                    {otherMatchUser.user.username}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <MessagesList messages={messages} />
          ))
        )}
      </View>
      <View
        style={{
          paddingBottom: insets.bottom,
        }}
        className="border-t border-border p-6 bg-background flex flex-row items-center gap-2"
      >
        <View className="flex flex-row items-center border border-border bg-card min-h-10 px-2 rounded-full">
          <Input
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleSendMessage}
            editable={!areMessagesPending && !match?.resolved}
            placeholder={
              !areMessagesPending ? "Type a message..." : "Loading..."
            }
            returnKeyType="send"
            className="flex-1 self-center bg-transparent border-0 h-10 py-0"
          />
          <Button
            variant="foreground"
            className="h-9 w-9 m-1.5 rounded-full"
            size="icon"
            onPress={handleSendMessage}
          >
            <SendHorizontal className="text-background" size={18} />
          </Button>
        </View>
      </View>
    </ModalContainer>
  );
}
