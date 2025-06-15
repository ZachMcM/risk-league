import { SessionProvider } from "@/components/providers/SessionProvider";
import { themes } from "@/themes";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useFocusEffect,
} from "@react-navigation/native";
import { defaultConfig } from "@tamagui/config/v4";
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import type { AppStateStatus } from "react-native";
import { AppState, Platform } from "react-native";
import "react-native-reanimated";
import { createTamagui, TamaguiProvider } from "tamagui";

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

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

const config = createTamagui({
  ...defaultConfig,
  themes,
});

const queryClient = new QueryClient();

export default function RootLayout() {
  function onAppStateChange(status: AppStateStatus) {
    if (Platform.OS !== "web") {
      focusManager.setFocused(status === "active");
    }
  }

  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);

    return () => subscription.remove();
  }, []);

  return (
    <TamaguiProvider config={config}>
      {/* <ThemeProvider value={DarkTheme}> */}
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </SessionProvider>
      </QueryClientProvider>
      {/* </ThemeProvider> */}
    </TamaguiProvider>
  );
}
