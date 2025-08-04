import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import { Text } from "~/components/ui/text";
import { useMessages } from "../providers/MessagesProvider";
import ProfileImage from "../ui/profile-image";
import { authClient } from "~/lib/auth-client";
import { cn } from "~/utils/cn";

export default function MessagesList() {
  const { messages } = useMessages();
  const { data } = authClient.useSession();
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);


  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1 p-8 w-full"
      showsVerticalScrollIndicator={false}
    >
      {messages?.map((message, index) => {
        const isCurrentUser = data?.user.id && message.user.id === data?.user.id!;

        return (
          <View
            key={`${message.userId}-${message.createdAt}-${index}`}
            className={cn(
              "mb-4 flex flex-col gap-2",
              isCurrentUser ? "items-end" : "items-start"
            )}
          >
            <View className="flex flex-row gap-4">
              {!isCurrentUser && (
                <ProfileImage
                  className="h-14 w-14 flex-shrink-0"
                  image={message.user.image}
                  username={message.user.username}
                />
              )}
              <View className="flex flex-col gap-2 max-w-[80%]">
                <View
                  className={cn(
                    "rounded-2xl px-4 py-2",
                    isCurrentUser ? "bg-primary" : "bg-secondary",
                    isCurrentUser ? "rounded-br-md" : "rounded-bl-md"
                  )}
                >
                  <Text className="leading-5" style={{ flexWrap: "wrap" }}>
                    {message.content}
                  </Text>
                </View>
              </View>
            </View>
            <Text className="text-muted-foreground text-sm">
              {timeAgo(message.createdAt)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
