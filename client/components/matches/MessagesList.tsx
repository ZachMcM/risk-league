import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import { Text } from "~/components/ui/text";
import { cn, timeAgo } from "~/lib/utils";
import { useSession } from "../providers/SessionProvider";
import Pfp from "../ui/pfp";
import { useMessages } from "../providers/MessagesProvider";

export default function MessagesList() {
  const { messages } = useMessages();
  const { session } = useSession();
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
        const isCurrentUser = session?.user.id && message.user.id === session.user.id;

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
                <Pfp
                  className="h-12 w-12 flex-shrink-0"
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
