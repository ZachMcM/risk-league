import { useQueryClient } from "@tanstack/react-query";
import { router, usePathname } from "expo-router";
import { createContext, ReactNode, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { io, Socket } from "socket.io-client";
import { authClient } from "~/lib/auth-client";

const RealtimeContext = createContext<{ isConnected: boolean }>({
  isConnected: false,
});

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: currentUserData } = authClient.useSession();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isUnmountingRef = useRef(false);
  const queryClientRef = useRef(queryClient);
  const userIdRef = useRef(currentUserData?.user?.id);

  // Keep refs updated without triggering reconnects
  useEffect(() => {
    queryClientRef.current = queryClient;
    userIdRef.current = currentUserData?.user?.id;
  });

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
      if (!isUnmountingRef.current) {
        setIsConnected(false);
      }
    });

    socket.on("data-invalidated", (queryKey: string[]) => {
      if (!isUnmountingRef.current && queryClientRef.current) {
        queryClientRef.current.invalidateQueries({
          queryKey,
        });
      }
    });

    socket.on(
      "friendly-match-request-accepted",
      async ({ matchId }: { matchId: number }) => {
        if (isUnmountingRef.current) return;

        const userId = userIdRef.current;
        const qc = queryClientRef.current;

        if (!userId || !qc) return;

        await qc.invalidateQueries({
          queryKey: ["match-ids", userId, "unresolved"],
        });
        await qc.invalidateQueries({
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

        if (socketRef.current.connected) {
          socketRef.current.disconnect();
        }

        socketRef.current.close();
        socketRef.current = null;
      }

      setIsConnected(false);
    };
  }, [currentUserData?.user.id]);

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}
