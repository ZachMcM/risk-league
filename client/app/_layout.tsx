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
import { Toaster } from "sonner-native";
import {
  SessionProvider,
  useSession,
} from "~/components/providers/SessionProvider";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { SplashScreenController } from "~/components/ui/splash";

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
  const { isDarkColorScheme } = useColorScheme();

  useFonts({
    "Geist-Thin": require("~/assets/fonts/Geist/ttf/Geist-Thin.ttf"),
    "Geist-ThinItalic": require("~/assets/fonts/Geist/ttf/Geist-ThinItalic.ttf"),
    "Geist-ExtraLight": require("~/assets/fonts/Geist/ttf/Geist-ExtraLight.ttf"),
    "Geist-ExtraLightItalic": require("~/assets/fonts/Geist/ttf/Geist-ExtraLightItalic.ttf"),
    "Geist-Light": require("~/assets/fonts/Geist/ttf/Geist-Light.ttf"),
    "Geist-LightItalic": require("~/assets/fonts/Geist/ttf/Geist-LightItalic.ttf"),
    "Geist-Regular": require("~/assets/fonts/Geist/ttf/Geist-Regular.ttf"),
    "Geist-RegularItalic": require("~/assets/fonts/Geist/ttf/Geist-RegularItalic.ttf"),
    "Geist-Medium": require("~/assets/fonts/Geist/ttf/Geist-Medium.ttf"),
    "Geist-MediumItalic": require("~/assets/fonts/Geist/ttf/Geist-MediumItalic.ttf"),
    "Geist-SemiBold": require("~/assets/fonts/Geist/ttf/Geist-SemiBold.ttf"),
    "Geist-SemiBoldItalic": require("~/assets/fonts/Geist/ttf/Geist-SemiBoldItalic.ttf"),
    "Geist-Bold": require("~/assets/fonts/Geist/ttf/Geist-Bold.ttf"),
    "Geist-BoldItalic": require("~/assets/fonts/Geist/ttf/Geist-BoldItalic.ttf"),
    "Geist-ExtraBold": require("~/assets/fonts/Geist/ttf/Geist-ExtraBold.ttf"),
    "Geist-ExtraBoldItalic": require("~/assets/fonts/Geist/ttf/Geist-ExtraBoldItalic.ttf"),
    "Geist-Black": require("~/assets/fonts/Geist/ttf/Geist-Black.ttf"),
    "Geist-BlackItalic": require("~/assets/fonts/Geist/ttf/Geist-BlackItalic.ttf"),
  });

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
              <SplashScreenController />
              <RootNavigatior />
              <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
              <PortalHost />
            </ThemeProvider>
          </SessionProvider>
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
  );
}

export function RootNavigatior() {
  const { session } = useSession();

  return (
    <Stack>
      <Stack.Protected guard={session != null}>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="lobby" options={{ headerShown: false }} />
        <Stack.Screen name="signin" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen
        name="matchmaking"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
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
