import { useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useEffect, useState } from "react";
import { View } from "react-native";
import { io } from "socket.io-client";
import { toast } from "sonner-native";
import { authClient } from "~/lib/auth-client";
import { Message } from "~/types/match";
import ProfileImage from "../ui/profile-image";
import { Text } from "../ui/text";
import { Card, CardContent } from "../ui/card";

const RealTimeContext = createContext<{ isConnected: boolean }>({
  isConnected: false,
});

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data } = authClient.useSession();

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log("RealtimeProvider useEffect running, user data:", data);

    if (!data?.user?.id) {
      console.log("No user ID, returning early");
      return;
    }

    console.log("Creating socket connection for user:", data.user.id);

    const socket = io(`${process.env.EXPO_PUBLIC_API_URL}/realtime`, {
      transports: ["websocket"],
      auth: {
        userId: data.user.id,
      },
    });

    console.log("Socket created, adding listeners");

    socket.on("connect", () => {
      console.log("Socket connected!");
      setIsConnected(true);
    });
    socket.on("disconnect", () => {
      console.log("Socket disconnected!");
      setIsConnected(false);
    });

    socket.on("data-invalidated", (queryKey: string[]) => {
      queryClient.invalidateQueries({
        queryKey,
      });
    });

    socket.on("match-message-received", (message: Message) => {
      console.log("Message received:", message);
      console.log("Current user ID:", data?.user.id);
      console.log("Message user ID:", message.userId);

      if (message.userId !== data?.user.id) {
        console.log("Showing toast notification");
        toast.custom(
          <Card className="m-2">
            <CardContent className="flex flex-row gap-3 items-center p-4">
              <ProfileImage
                className="h-12 w-12"
                image={message.user.image}
                username={message.user.username}
              />
              <View className="flex flex-col w-full">
                <Text className="font-bold text-lg">
                  {message.user.username}
                </Text>
                <Text className="max-w-[80%]">{message.content}</Text>
              </View>
            </CardContent>
          </Card>
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, data?.user.id]);

  return (
    <RealTimeContext.Provider value={{ isConnected }}>
      {children}
    </RealTimeContext.Provider>
  );
}
