import { useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useEffect, useState } from "react";
import { io } from "socket.io-client";

const RealTimeContext = createContext<{ isConnected: boolean }>({
  isConnected: false,
});

export function RealTimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(`${process.env.EXPO_PUBLIC_API_URL}/match`, {
      transports: ["websocket"],
    });

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("data-invalidated", (queryKey: string[]) => {
      queryClient.invalidateQueries({
        queryKey,
      });
    });
  }, [queryClient]);

  return (
    <RealTimeContext.Provider value={{ isConnected }}>
      {children}
    </RealTimeContext.Provider>
  );
}
