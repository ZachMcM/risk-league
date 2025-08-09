import { useEffect, useRef } from "react";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";
import { Message } from "~/types/match";
import { cn } from "~/utils/cn";
import { timeAgo } from "~/utils/dateUtils";
import ProfileImage from "../ui/profile-image";
import { FlatList } from "react-native-gesture-handler";

export default function MessagesList({ messages }: { messages: Message[] }) {
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Use setTimeout to ensure the FlatList has finished rendering
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: messages.length - 1,
          animated: true,
          viewPosition: 0, // Position at bottom
        });
      }, 100);
    }
  }, [messages]);

  return (
    <FlatList
      ref={flatListRef}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingVertical: 8,
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={false}
      data={messages}
      renderItem={({ item }) => <MessageCard message={item} />}
      keyExtractor={(item, index) =>
        `${item.userId}-${item.createdAt}-${index}`
      }
      onLayout={() => {
        if (messages.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: messages.length - 1,
              animated: true,
              viewPosition: 0,
            });
          }, 50);
        }
      }}
    />
  );
}

export function MessageCard({ message }: { message: Message }) {
  const { data } = authClient.useSession();
  const isCurrentUser = message.userId == data?.user.id;

  return (
    <View
      className={cn(
        "mb-4 flex flex-col gap-2",
        isCurrentUser ? "items-end" : "items-start"
      )}
    >
      <View className="flex flex-row gap-4">
        {!isCurrentUser && (
          <ProfileImage
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
}
