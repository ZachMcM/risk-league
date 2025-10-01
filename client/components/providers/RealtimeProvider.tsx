import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "expo-router";
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
