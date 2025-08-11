import { useQueryClient } from "@tanstack/react-query";
import { Link, router, usePathname } from "expo-router";
import { createContext, ReactNode, useEffect, useState } from "react";
import { View } from "react-native";
import { io } from "socket.io-client";
import { toast } from "sonner-native";
import { authClient } from "~/lib/auth-client";
import { League } from "~/lib/constants";
import { Message } from "~/types/match";
import { Card, CardContent } from "../ui/card";
import LeagueLogo from "../ui/league-logos/LeagueLogo";
import ProfileImage from "../ui/profile-image";
import { Text } from "../ui/text";

const RealtimeContext = createContext<{ isConnected: boolean }>({
  isConnected: false,
});

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data } = authClient.useSession();

  const [isConnected, setIsConnected] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    console.log("RealtimeProvider useEffect running, user data:", data);

    if (!data?.user?.id) {
      console.log("No user ID, returning early");
      return;
    }

    console.log("Creating socket connection for user:", data.user.id);
    console.log(pathname.substring(pathname.lastIndexOf("/")));

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
      "parlay-resolved",
      ({
        league,
        matchId,
        parlayId,
      }: {
        league: League;
        matchId: number;
        parlayId: number;
      }) => {
        const toastId = toast.custom(
          <Link
            href={{
              pathname: "/match/[matchId]",
              params: { matchId, openSubRoute: "parlay", subRouteId: parlayId },
            }}
            className="m-3"
            onPress={() => toast.dismiss(toastId)}
          >
            <Card>
              <CardContent className="w-full flex flex-row gap-3 items-center px-4 py-3">
                <LeagueLogo league={league} size={28} />
                <View className="flex flex-col flex-1">
                  <Text className="font-bold text-lg">
                    One of your {league.toUpperCase()} parlays finished!
                  </Text>
                  <Text className="text-muted-foreground font-semibold">
                    Click here to view the results!
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Link>
        );
      }
    );

    socket.on(
      "match-ended",
      ({
        type,
        league,
        id,
      }: {
        type: "competitive" | "friendly";
        league: League;
        id: number;
      }) => {
        const toastId = toast.custom(
          <Link
            href={{
              pathname: "/match/[matchId]",
              params: { matchId: id },
            }}
            className="m-3"
            onPress={() => toast.dismiss(toastId)}
          >
            <Card>
              <CardContent className="w-full flex flex-row gap-4 items-center px-4 py-3">
                <LeagueLogo league={league} size={36} />
                <View className="flex flex-col flex-1">
                  <Text className="font-bold text-lg">
                    One of your {league.toUpperCase()} {type} matches ended!
                  </Text>
                  <Text className="text-muted-foreground font-semibold">
                    Click here to view the results!
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Link>
        );
      }
    );

    socket.on(
      "friend-request-received",
      ({ username, image }: { username: string; image: string }) => {
        const toastId = toast.custom(
          <Link
            href={{
              pathname: "/(tabs)/social",
              params: { tab: "requests" },
            }}
            className="m-3"
            onPress={() => toast.dismiss(toastId)}
          >
            <Card>
              <CardContent className="w-full flex flex-row gap-3 items-center px-4 py-3">
                <ProfileImage
                  className="h-12 w-12"
                  image={image}
                  username={username}
                />
                <View className="flex flex-col flex-1">
                  <Text className="font-bold text-lg">{username}</Text>
                  <Text className="font-semibold text-muted-foreground">
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
        const toastId = toast.custom(
          <Link
            href={{
              pathname: "/(tabs)/social",
              params: { tab: "friends" },
            }}
            className="m-3"
            onPress={() => toast.dismiss(toastId)}
          >
            <Card>
              <CardContent className="w-full flex flex-row gap-3 items-center px-4 py-3">
                <ProfileImage
                  className="h-12 w-12"
                  image={image}
                  username={username}
                />
                <View className="flex flex-col flex-1">
                  <Text className="font-bold text-lg">{username}</Text>
                  <Text className="font-semibold text-muted-foreground">
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
      if (
        message.userId !== data?.user.id &&
        pathname !== `/match/${message.matchId}/messages`
      ) {
        const toastId = toast.custom(
          <Link
            className="m-3"
            href={{
              pathname: "/match/[matchId]",
              params: { matchId: message.matchId, openSubRoute: "messages" },
            }}
            onPress={() => toast.dismiss(toastId)}
          >
            <Card>
              <CardContent className="w-full flex flex-row gap-3 items-center px-4 py-3">
                <ProfileImage
                  className="h-12 w-12"
                  image={message.user.image}
                  username={message.user.username}
                />
                <View className="flex flex-col flex-1">
                  <Text className="font-bold text-lg">
                    {message.user.username}
                  </Text>
                  <Text
                    className="text-muted-foreground font-semibold"
                    numberOfLines={2}
                  >
                    {message.content}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Link>
        );
      }
    });

    socket.on(
      "friendly-match-request-received",
      ({
        image,
        username,
        league,
      }: {
        image: string;
        username: string;
        league: League;
      }) => {
        if (pathname !== "/(tabs)/social") {
          const toastId = toast.custom(
            <Link href="/(tabs)/social" className="m-3" onPress={() => toast.dismiss(toastId)}>
              <Card>
                <CardContent className="w-full flex flex-row gap-3 items-center px-4 py-3">
                  <ProfileImage
                    className="h-12 w-12"
                    image={image}
                    username={username}
                  />
                  <View className="flex flex-col flex-1">
                    <Text className="font-bold text-lg">{username}</Text>
                    <Text className="text-muted-foreground font-semibold">
                      Challenged you to a {league.toUpperCase()} friendly match!
                    </Text>
                  </View>
                </CardContent>
              </Card>
            </Link>,
            {
              duration: Infinity,
            }
          );
        }
      }
    );

    socket.on(
      "friendly-match-request-decliend",
      ({
        image,
        username,
        league,
      }: {
        image: string;
        username: string;
        league: League;
      }) => {
        toast.custom(
          <Card className="m-3">
            <CardContent className="w-full flex flex-row gap-3 items-center px-4 py-3">
              <ProfileImage
                className="h-12 w-12"
                image={image}
                username={username}
              />
              <View className="flex flex-col flex-1">
                <Text className="font-bold text-lg">{username}</Text>
                <Text className="text-muted-foreground font-semibold">
                  Declined your {league.toUpperCase()} friendly match request!
                </Text>
              </View>
            </CardContent>
          </Card>
        );
      }
    );

    socket.on(
      "friendly-match-request-accepted",
      ({ matchId }: { matchId: number }) => {
        router.navigate({
          pathname: "/match/[matchId]",
          params: { matchId },
        });
      }
    );

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
