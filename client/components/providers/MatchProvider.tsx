import { useLocalSearchParams } from "expo-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { MatchMessage, UserStats } from "~/types/matches";
import { useSession } from "./SessionProvider";
import { toast } from "sonner-native";
import { View } from "react-native";
import Pfp from "../ui/pfp";
import { Text } from "../ui/text";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMatchMessages, getMatchStats } from "~/endpoints";

type MatchProviderValues = {
  messages: MatchMessage[];
  setMessages: React.Dispatch<React.SetStateAction<MatchMessage[]>>;
  stats: UserStats[];
  setStats: React.Dispatch<React.SetStateAction<UserStats[]>>;
  sendMessage: (content: string) => void;
  isConnected: boolean;
  isMessagesPending: boolean;
  isStatsPending: boolean;
};

const MatchContext = createContext<MatchProviderValues | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const { id } = useLocalSearchParams() as { id: string };
  const { session } = useSession();

  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const [stats, setStats] = useState<UserStats[]>([]);

  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  const queryClient = useQueryClient()

  const { data: initMessages, isPending: isMessagesPending } = useQuery({
    queryKey: ["match", "messages", id],
    queryFn: async () => getMatchMessages(id),
  });

  useEffect(() => {
    if (initMessages) {
      setMessages(initMessages);
    }
  }, [isMessagesPending]);

  const { data: initStats, isPending: isStatsPending } = useQuery({
    queryKey: ["match", "stats", id],
    queryFn: async () => getMatchStats(id),
  });

  useEffect(() => {
    if (initStats) {
      setStats(initStats);
    }
  }, [isStatsPending]);

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
      setMessages((prev) => [...prev, messageData]);
      if (messageData.userId != session.user.id) {
        toast.custom(
          <View className="flex flex-row gap-3 m-8 items-center p-4 bg-card rounded-2xl">
            <Pfp className="h-12 w-12" image={messageData.image} username={messageData.username} />
            <View className="flex flex-col w-full">
              <Text className="font-bold text-lg">{messageData.username}</Text>
              <Text className="max-w-[80%]">{messageData.content}</Text>
            </View>
          </View>
        );
      }
      queryClient.invalidateQueries({
        queryKey: ["match", "messages", id]
      })
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
        setMessages,
        sendMessage,
        isConnected,
        stats,
        setStats,
        isMessagesPending,
        isStatsPending,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  return useContext(MatchContext) as MatchProviderValues;
}
