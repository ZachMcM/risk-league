import { useQueryClient } from "@tanstack/react-query";
import { Link, router, usePathname } from "expo-router";
import { createContext, ReactNode, useEffect, useRef, useState } from "react";
import { AppState, Pressable, View } from "react-native";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner-native";
import { authClient } from "~/lib/auth-client";
import { League } from "~/lib/config";
import { Card, CardContent } from "../ui/card";
import LeagueLogo from "../ui/league-logos/LeagueLogo";
import ProfileImage from "../ui/profile-image";
import { Text } from "../ui/text";
import { Message } from "~/types/message";

const RealtimeContext = createContext<{ isConnected: boolean }>({
  isConnected: false,
});

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: currentUserData } = authClient.useSession();
  const [isConnected, setIsConnected] = useState(false);
  const pathname = usePathname();
  const socketRef = useRef<Socket | null>(null);
  const isUnmountingRef = useRef(false);

  useEffect(() => {
    if (!currentUserData?.user?.id) {
      return;
    }

    // Mark as not unmounting when setting up new connection
    isUnmountingRef.current = false;

    const socket = io(`${process.env.EXPO_PUBLIC_API_URL}/realtime`, {
      transports: ["websocket"],
      auth: {
        userId: currentUserData.user.id,
      },
      forceNew: true, // Force new connection to prevent stale connections
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (!isUnmountingRef.current) {
        setIsConnected(true);
      }
    });

    socket.on("disconnect", () => {
      if (!isUnmountingRef.current) {
        setIsConnected(false);
      }
    });

    socket.on("connect_error", (error) => {
      console.warn("Socket connection error:", error);
      if (!isUnmountingRef.current) {
        setIsConnected(false);
      }
    });

    socket.on("data-invalidated", (queryKey: string[]) => {
      queryClient.invalidateQueries({
        queryKey,
      });
    });

    socket.on(
      "match-parlay-resolved",
      ({ matchId, parlayId }: { matchId: number; parlayId: number }) => {
        const toastId = toast.custom(
          <Pressable
            className="m-3"
            onPress={() => {
              if (router.canDismiss()) {
                router.dismissAll();
              }
              router.navigate({
                pathname: "/match/[matchId]",
                params: {
                  matchId,
                  openSubRoute: "parlay",
                  subRouteId: parlayId,
                },
              });
              toast.dismiss(toastId);
            }}
          >
            <Card className="border-0">
              <CardContent className="w-full flex flex-col px-4 py-3">
                <Text className="font-bold">
                  One of your match parlays finished!
                </Text>
                <Text className="text-muted-foreground font-semibold">
                  Click here to view the results!
                </Text>
              </CardContent>
            </Card>
          </Pressable>
        );
      }
    );

    socket.on(
      "dynasty-league-parlay-resolved",
      ({
        dynastyLeagueId,
        parlayId,
      }: {
        dynastyLeagueId: number;
        parlayId: number;
      }) => {
        const toastId = toast.custom(
          <Pressable
            className="m-3"
            onPress={() => {
              if (router.canDismiss()) {
                router.dismissAll();
              }
              router.navigate({
                pathname: "/dynastyLeague/[dynastyLeagueId]",
                params: {
                  dynastyLeagueId,
                  openSubRoute: "parlay",
                  subRouteId: parlayId,
                },
              });
              toast.dismiss(toastId);
            }}
          >
            <Card className="border-0">
              <CardContent className="w-full flex flex-col px-4 py-3">
                <Text className="font-bold">
                  One of your match parlays finished!
                </Text>
                <Text className="text-muted-foreground font-semibold">
                  Click here to view the results!
                </Text>
              </CardContent>
            </Card>
          </Pressable>
        );
      }
    );

    // socket.on(
    //   "match-ended",
    //   ({
    //     type,
    //     league,
    //     id,
    //   }: {
    //     type: "competitive" | "friendly";
    //     league: League;
    //     id: number;
    //   }) => {
    //     const toastId = toast.custom(
    //       <Pressable
    //         className="m-3"
    //         onPress={() => {
    //           if (router.canDismiss()) {
    //             router.dismissAll();
    //           }
    //           router.navigate({
    //             pathname: "/match/[matchId]",
    //             params: { matchId: id },
    //           });
    //           toast.dismiss(toastId);
    //         }}
    //       >
    //         <Card className="border-0">
    //           <CardContent className="w-full flex flex-row gap-4 items-center px-4 py-3">
    //             <LeagueLogo league={league} size={32} />
    //             <View className="flex flex-col flex-1">
    //               <Text className="font-bold">
    //                 One of your {league.toUpperCase()} {type} matches ended!
    //               </Text>
    //               <Text className="text-muted-foreground font-semibold">
    //                 Click here to view the results!
    //               </Text>
    //             </View>
    //           </CardContent>
    //         </Card>
    //       </Pressable>
    //     );
    //   }
    // );

    socket.on(
      "friend-request-received",
      ({ username, image }: { username: string; image: string }) => {
        const toastId = toast.custom(
          <Pressable
            className="m-3"
            onPress={() => {
              if (router.canDismiss()) {
                router.dismissAll();
              }
              router.navigate({
                pathname: "/(tabs)/social",
                params: { tab: "requests" },
              });
              toast.dismiss(toastId);
            }}
          >
            <Card className="border-0">
              <CardContent className="w-full flex flex-row gap-3 items-center px-4 py-3">
                <ProfileImage
                  className="h-12 w-12"
                  image={image}
                  username={username}
                />
                <View className="flex flex-col flex-1">
                  <Text className="font-bold">{username}</Text>
                  <Text className="font-semibold text-muted-foreground">
                    Requested to be friends!
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Pressable>
        );
      }
    );

    socket.on(
      "friend-request-accepted",
      ({ username, image }: { username: string; image: string }) => {
        const toastId = toast.custom(
          <Pressable
            className="m-3"
            onPress={() => {
              if (router.canDismiss()) {
                router.dismissAll();
              }
              router.navigate({
                pathname: "/(tabs)/social",
                params: { tab: "friends" },
              });
              toast.dismiss(toastId);
            }}
          >
            <Card className="border-0">
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
          </Pressable>
        );
      }
    );

    socket.on("match-message-received", (message: Message) => {
      if (
        message.userId !== currentUserData?.user.id &&
        pathname !== `/match/${message.matchId}/messages`
      ) {
        const toastId = toast.custom(
          <Pressable
            className="m-3"
            onPress={() => {
              if (
                router.canDismiss() &&
                pathname !== `/match/${message.matchId}`
              ) {
                router.dismissAll();
              }
              router.navigate({
                pathname: "/match/[matchId]",
                params: { matchId: message.matchId!, openSubRoute: "messages" },
              });
              toast.dismiss(toastId);
            }}
          >
            <Card className="border-0">
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
          </Pressable>
        );
      }
    });

    socket.on("dynasty-league-message-received", (message: Message) => {
      if (
        message.userId !== currentUserData?.user.id &&
        pathname !== `/dynastyLeague/${message.dynastyLeagueId}/messages`
      ) {
        const toastId = toast.custom(
          <Pressable
            className="m-3"
            onPress={() => {
              if (
                router.canDismiss() &&
                pathname !== `/dynastyLeague/${message.dynastyLeagueId}`
              ) {
                router.dismissAll();
              }
              router.navigate({
                pathname: "/dynastyLeague/[dynastyLeagueId]",
                params: {
                  dynastyLeagueId: message.dynastyLeagueId!,
                  openSubRoute: "messages",
                },
              });
              toast.dismiss(toastId);
            }}
          >
            <Card className="border-0">
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
          </Pressable>
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
            <Pressable
              className="m-3"
              onPress={() => {
                if (router.canDismiss()) {
                  router.dismissAll();
                }
                router.navigate("/(tabs)/social");
                toast.dismiss(toastId);
              }}
            >
              <Card className="border-0">
                <CardContent className="w-full flex flex-row gap-3 items-center px-4 py-3">
                  <ProfileImage
                    className="h-12 w-12"
                    image={image}
                    username={username}
                  />
                  <View className="flex flex-col flex-1">
                    <Text className="font-bold">{username}</Text>
                    <Text className="text-muted-foreground font-semibold">
                      Challenged you to a {league.toUpperCase()} friendly match!
                    </Text>
                  </View>
                </CardContent>
              </Card>
            </Pressable>,
            {
              duration: Infinity,
            }
          );
        }
      }
    );

    socket.on(
      "opp-parlay-placed",
      ({
        image,
        username,
        stake,
        legs,
        type,
        matchId,
      }: {
        image: string;
        username: string;
        stake: number;
        legs: number;
        type: "perfect" | "flex";
        matchId: number;
      }) => {
        const toastId = toast.custom(
          <Pressable
            className="m-3"
            onPress={() => {
              if (router.canDismiss()) {
                router.dismissAll();
              }
              router.navigate({
                pathname: "/match/[matchId]",
                params: {
                  matchId,
                },
              });
              toast.dismiss(toastId);
            }}
          >
            <Card className="border-0">
              <CardContent className="w-full flex flex-row gap-3 items-center px-4 py-3">
                <ProfileImage
                  className="h-12 w-12"
                  image={image}
                  username={username}
                />
                <View className="flex flex-col flex-1">
                  <Text className="font-bold text-lg">
                    {username} placed a bet
                  </Text>
                  <Text
                    className="text-muted-foreground font-semibold"
                    numberOfLines={2}
                  >
                    Get in the match and make a better bet today!
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Pressable>
        );
      }
    );

    socket.on(
      "friendly-match-request-declined",
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
                <Text className="font-bold">{username}</Text>
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
      async ({ matchId }: { matchId: number }) => {
        await queryClient.invalidateQueries({
          queryKey: ["match-ids", currentUserData?.user.id, "unresolved"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["match", matchId],
        });
        if (router.canDismiss()) {
          router.dismissAll();
        }
        router.navigate({
          pathname: "/match/[matchId]",
          params: { matchId },
        });
      }
    );

    // Handle app state changes to manage connection properly
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "background" && socket?.connected) {
        socket.disconnect();
      } else if (
        nextAppState === "active" &&
        !socket?.connected &&
        !isUnmountingRef.current
      ) {
        socket.connect();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      isUnmountingRef.current = true;
      subscription?.remove();

      if (socketRef.current) {
        // Remove all listeners first to prevent events during cleanup
        socketRef.current.removeAllListeners();

        // Disconnect forcefully with a timeout
        const disconnectTimeout = setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.close();
          }
        }, 100);

        if (socketRef.current.connected) {
          socketRef.current.disconnect();
        }

        clearTimeout(disconnectTimeout);
        socketRef.current = null;
      }

      setIsConnected(false);
    };
  }, [queryClient, currentUserData?.user.id, pathname]);

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}
