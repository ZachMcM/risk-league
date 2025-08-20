import "~/global.css";

import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
  useFocusEffect,
} from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import * as Network from "expo-network";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { useEffect } from "react";
import type { AppStateStatus } from "react-native";
import { Appearance, AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { SplashScreenController } from "~/components/ui/splash";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import { authClient } from "~/lib/auth-client";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { RealtimeProvider } from "~/components/providers/RealtimeProvider";

onlineManager.setEventListener((setOnline) => {
  const eventSubscription = Network.addNetworkStateListener((state) => {
    setOnline(!!state.isConnected);
  });
  return eventSubscription.remove;
});

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

const usePlatformSpecificSetup = Platform.select({
  web: useSetWebBackgroundClassName,
  android: useSetAndroidNavigationBar,
  default: noop,
});

SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

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

  usePlatformSpecificSetup();
  const { isDarkColorScheme, setColorScheme } = useColorScheme();
  setColorScheme("dark");

  return (
    <React.Fragment>
      <SafeAreaProvider>
        <GestureHandlerRootView>
          <QueryClientProvider client={queryClient}>
            <RealtimeProvider>
              <ThemeProvider value={DARK_THEME}>
                <SplashScreenController />
                <RootNavigatior />
                <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
              </ThemeProvider>
            </RealtimeProvider>
            <Toaster
              toastOptions={{
                style: {
                  backgroundColor: isDarkColorScheme
                    ? "hsl(223.8136 0% 9.0527%)" // from --card .dark:root
                    : "hsl(223.8136 -172.5242% 100%)", // from --card .root
                  borderColor: isDarkColorScheme
                    ? "hsl(223.8136 0% 15.5096%)" // from --border .dark:root
                    : "hsl(223.8136 0.0001% 89.8161%)", // from --border .root
                  borderWidth: 1,
                },
              }}
            />
          </QueryClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
      <PortalHost />
    </React.Fragment>
  );
}

export function RootNavigatior() {
  const { data } = authClient.useSession();

  return (
    <Stack>
      <Stack.Protected guard={data != null}>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={data == null}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signin" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="match" options={{ headerShown: false }} />
      <Stack.Screen
        name="career"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="settings"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="leaderboard"
        options={{ headerShown: false, presentation: "modal" }}
      />
    </Stack>
  );
}

const useIsomorphicLayoutEffect =
  Platform.OS === "web" && typeof window === "undefined"
    ? React.useEffect
    : React.useLayoutEffect;

function useSetWebBackgroundClassName() {
  useIsomorphicLayoutEffect(() => {
    // Adds the background color to the html element to prevent white background on overscroll.
    document.documentElement.classList.add("bg-background");
  }, []);
}

function useSetAndroidNavigationBar() {
  React.useLayoutEffect(() => {
    setAndroidNavigationBar(Appearance.getColorScheme() ?? "light");
  }, []);
}

export function useRefreshOnFocus<T>(refetch: () => Promise<T>) {
  const firstTimeRef = React.useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      refetch();
    }, [refetch])
  );
}

function noop() {}
