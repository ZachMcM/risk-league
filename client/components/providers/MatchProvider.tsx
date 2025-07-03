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
import { getMatchMessages, getMatchStats } from "~/endpoints";
import { MatchMessage, UserStats } from "~/types/matches";
import Pfp from "../ui/pfp";
import { Text } from "../ui/text";
import { useSession } from "./SessionProvider";

type MatchProviderValues = {
  messages: MatchMessage[] | undefined;
  stats: UserStats | undefined;
  opponentStats: UserStats | undefined;
  sendMessage: (content: string) => void;
  isConnected: boolean;
  messagesPending: boolean;
  statsPending: boolean;
  opponentStatsPending: boolean;
};

const MatchContext = createContext<MatchProviderValues | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const { id } = useLocalSearchParams() as { id: string };
  const { session } = useSession();

  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  const queryClient = useQueryClient();

  const { data: messages, isPending: messagesPending } = useQuery({
    queryKey: ["match", "messages", id],
    queryFn: async () => getMatchMessages(id),
  });

  const { data: stats, isPending: statsPending } = useQuery({
    queryKey: ["match", id, "my_stats"],
    queryFn: async () => getMatchStats(id, false),
  });

  const { data: opponentStats, isPending: opponentStatsPending } = useQuery({
    queryKey: ["match", id, "opponent_stats"],
    queryFn: async () => getMatchStats(id, true),
  });

  function sendMessage(content: string) {
    if (socketRef.current && content.trim()) {
      socketRef.current.emit("send-message", { content: content.trim() });
    }
  }

  useEffect(() => {
    if (!session?.user.id || !id) return;

    const socket = io(`${process.env.EXPO_PUBLIC_API_URL}/match`, {
      query: { matchId: id, userId: session.user.id },
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
        ["match", "messages", id],
        (prev: MatchMessage[]) => [...prev, messageData]
      );
      if (messageData.userId != session.user.id) {
        toast.custom(
          <View className="flex flex-row gap-3 m-8 items-center p-4 bg-card rounded-2xl">
            <Pfp
              className="h-12 w-12"
              image={messageData.image}
              username={messageData.username}
            />
            <View className="flex flex-col w-full">
              <Text className="font-bold text-lg">{messageData.username}</Text>
              <Text className="max-w-[80%]">{messageData.content}</Text>
            </View>
          </View>
        );
      }
      queryClient.invalidateQueries({
        queryKey: ["match", "messages", id],
      });
    });

    socket.on("message-error", (error: { error: string }) => {
      console.error("Message error:", error.error);
    });

    return () => {
      socket.disconnect();
      setIsConnected(false);
    };
  }, [session?.user.id, id]);

  return (
    <MatchContext.Provider
      value={{
        messages,
        sendMessage,
        isConnected,
        stats,
        messagesPending,
        statsPending,
        opponentStats,
        opponentStatsPending,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  return useContext(MatchContext) as MatchProviderValues;
}
