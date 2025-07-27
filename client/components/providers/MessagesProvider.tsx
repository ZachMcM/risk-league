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
import { getMatchMessages } from "~/endpoints";
import { MatchMessage } from "~/types/matches";
import Pfp from "../ui/pfp";
import { Text } from "../ui/text";
import { useSession } from "./SessionProvider";

export type MessagesProviderTypes = {
  messages: MatchMessage[] | undefined;
  sendMessage: (content: string) => void;
  isConnected: boolean;
  messagesPending: boolean;
};

const MessagesContext = createContext<MessagesProviderTypes | null>(null);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const searchParams = useLocalSearchParams() as { matchId: string };
  const matchId = parseInt(searchParams.matchId);

  const { session } = useSession();

  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  const queryClient = useQueryClient();

  const { data: messages, isPending: messagesPending } = useQuery({
    queryKey: ["match", "messages", matchId],
    queryFn: async () => getMatchMessages(matchId),
  });

  function sendMessage(content: string) {
    if (socketRef.current && content.trim()) {
      socketRef.current.emit("send-message", { content: content.trim() });
    }
  }

  useEffect(() => {
    if (!session?.user.id || !matchId) return;

    console.log("Connecting with params:", {
      matchId: matchId.toString(),
      userId: session.user.id.toString(),
    });
    const socket = io(`${process.env.EXPO_PUBLIC_API_URL}/match`, {
      auth: { matchId: matchId.toString(), userId: session.user.id.toString() },
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
    socket.on("message-received", (messageData: MatchMessage) => {
      queryClient.setQueryData(
        ["match", "messages", matchId],
        (prev: MatchMessage[]) => [...prev, messageData]
      );
      if (messageData.user.id != session.user.id) {
        toast.custom(
          <View className="flex flex-row gap-3 m-8 items-center p-4 bg-card rounded-2xl">
            <Pfp
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
  }, [session?.user.id, matchId]);

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
