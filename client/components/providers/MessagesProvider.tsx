import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import { io } from "socket.io-client";
import { toast } from "sonner-native";
import ProfileImage from "../ui/profile-image";
import { Text } from "../ui/text";
import { authClient } from "~/lib/auth-client";
import { getMessages } from "~/endpoints";
import { Message } from "~/types/match";

export type MessagesProviderTypes = {
  messages: Message[] | undefined;
  sendMessage: (content: string) => void;
  isConnected: boolean;
  messagesPending: boolean;
};

const MessagesContext = createContext<MessagesProviderTypes | null>(null);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const searchParams = useLocalSearchParams() as { matchId: string };
  const matchId = parseInt(searchParams.matchId);

  const { data } = authClient.useSession();

  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  const queryClient = useQueryClient();

  const { data: messages, isPending: messagesPending } = useQuery({
    queryKey: ["match", "messages", matchId],
    queryFn: async () => getMessages(matchId),
  });

  function sendMessage(content: string) {
    if (socketRef.current && content.trim()) {
      socketRef.current.emit("send-message", { content: content.trim() });
    }
  }

  useEffect(() => {
    if (!data?.user.id || !matchId) return;

    console.log("Connecting with params:", {
      matchId: matchId,
      userId: data.user.id,
    });
    const socket = io(`${process.env.EXPO_PUBLIC_API_URL}/match`, {
      auth: { matchId: matchId.toString(), userId: data.user.id },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to match socket");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from match socket");
      setIsConnected(false);
    });

    // Message events
    socket.on("message-received", (messageData: Message) => {
      queryClient.setQueryData(
        ["match", "messages", matchId],
        (prev: Message[]) => [...prev, messageData]
      );
      if (messageData.user.id != data.user.id) {
        toast.custom(
          <View className="flex flex-row gap-3 m-8 items-center p-4 bg-card rounded-2xl">
            <ProfileImage
              className="h-12 w-12"
              image={messageData.user.image}
              username={messageData.user.username}
            />
            <View className="flex flex-col w-full">
              <Text className="font-bold text-lg">
                {messageData.user.username}
              </Text>
              <Text className="max-w-[80%]">{messageData.content}</Text>
            </View>
          </View>
        );
      }
    });

    socket.on("message-error", (error: { error: string }) => {
      toast.error(error.error);
    });

    return () => {
      socket.disconnect();
      setIsConnected(false);
    };
  }, [data?.user.id, matchId]);

  return (
    <MessagesContext.Provider
      value={{
        messages,
        sendMessage,
        isConnected,
        messagesPending,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  return useContext(MessagesContext) as MessagesProviderTypes;
}
