import { SessionProvider } from "@/components/providers/SessionProvider";
import { useFocusEffect } from "@react-navigation/native";
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import * as Network from "expo-network";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef } from "react";
import type { AppStateStatus } from "react-native";
import { AppState, Platform } from "react-native";
import "react-native-reanimated";

// refetch on screen focus
export function useRefreshOnFocus<T>(refetch: () => Promise<T>) {
  const firstTimeRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      refetch();
    }, [refetch])
  );
}

const queryClient = new QueryClient();

export default function RootLayout() {
  // refetch on app focus
  function onAppStateChange(status: AppStateStatus) {
    if (Platform.OS !== "web") {
      focusManager.setFocused(status === "active");
    }
  }

  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);

    return () => subscription.remove();
  }, []);

  // auto refetch on reconnect
  onlineManager.setEventListener((setOnline) => {
    const eventSubscription = Network.addNetworkStateListener((state) => {
      setOnline(!!state.isConnected);
    });
    return eventSubscription.remove;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
        </Stack>
        <StatusBar style="auto" />
      </SessionProvider>
    </QueryClientProvider>
  );
}
