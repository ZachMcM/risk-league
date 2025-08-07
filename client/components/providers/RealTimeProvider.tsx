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
import { Link } from "expo-router";

const RealtimeContext = createContext<{ isConnected: boolean }>({
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

    socket.on("connect", () => {
      setIsConnected(true);
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("data-invalidated", (queryKey: string[]) => {
      queryClient.invalidateQueries({
        queryKey,
      });
    });

    socket.on(
      "friend-request",
      ({ username, image }: { username: string; image: string }) => {
        toast.custom(
          <Link href="/social" className="m-2">
            <Card>
              <CardContent className="flex flex-row gap-3 items-center p-4">
                <ProfileImage
                  className="h-12 w-12"
                  image={image}
                  username={username}
                />
                <View className="flex flex-col w-full">
                  <Text className="font-bold">{username}</Text>
                  <Text className="text-lg font-semibold">
                    Requested to be friends!
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Link>
        );
      }
    );

    socket.on(
      "friend-request-accepted",
      ({ username, image }: { username: string; image: string }) => {
        toast.custom(
          <Link href="/social" className="m-2">
            <Card>
              <CardContent className="flex flex-row gap-3 items-center p-4">
                <ProfileImage
                  className="h-12 w-12"
                  image={image}
                  username={username}
                />
                <View className="flex flex-col w-full">
                  <Text className="font-bold">{username}</Text>
                  <Text className="text-lg font-semibold">
                    Accepted your friend request!
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Link>
        );
      }
    );

    socket.on("match-message-received", (message: Message) => {
      if (message.userId !== data?.user.id) {
        console.log("Showing toast notification");
        toast.custom(
          <Link
            className="m-2"
            href={{
              pathname: "/match/[matchId]",
              params: { matchId: message.matchId, openMessages: "true" },
            }}
          >
            <Card>
              <CardContent className="flex flex-row gap-3 items-center p-4">
                <ProfileImage
                  className="h-12 w-12"
                  image={message.user.image}
                  username={message.user.username}
                />
                <View className="flex flex-col w-full">
                  <Text className="font-bold">{message.user.username}</Text>
                  <Text className="max-w-[80%] text-lg font-semibold">
                    {message.content}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Link>
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, data?.user.id]);

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}
