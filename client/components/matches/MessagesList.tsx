import { useEffect, useRef } from "react";
import { FlatList, View } from "react-native";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";
import { Message } from "~/types/match";
import { cn } from "~/utils/cn";
import { timeAgo } from "~/utils/dateUtils";
import ProfileImage from "../ui/profile-image";
import { FlashList } from "@shopify/flash-list";
import { GridItemWrapper } from "../ui/grid-item-wrapper";

export default function MessagesList({ messages }: { messages: Message[] }) {
  const flashListRef = useRef<FlashList<Message>>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flashListRef.current?.scrollToIndex({
          index: messages.length - 1,
          animated: true,
          viewPosition: 0, // Position at bottom
        });
      }, 100);
    }
  }, [messages]);

  return (
    <FlashList
      contentContainerStyle={{
        padding: 16,
      }}
      ref={flashListRef}
      estimatedItemSize={60}
      showsVerticalScrollIndicator={false}
      data={messages}
      renderItem={({ item, index }) => (
        <GridItemWrapper
          index={index}
          gap={6}
          numCols={1}
        >
          <MessageCard message={item} />
        </GridItemWrapper>
      )}
      keyExtractor={(item, index) =>
        `${item.userId}-${item.createdAt}-${index}`
      }
      onLayout={() => {
        if (messages.length > 0) {
          setTimeout(() => {
            flashListRef.current?.scrollToIndex({
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
        "mb-2 flex flex-col gap-2",
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
