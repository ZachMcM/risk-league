import "~/global.css";

import NetInfo from "@react-native-community/netinfo";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import * as React from "react";
import { useEffect } from "react";
import type { AppStateStatus } from "react-native";
import { Appearance, AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import mobileAds from "react-native-google-mobile-ads";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { toast, Toaster } from "sonner-native";
import { AudioProvider } from "~/components/providers/AudioProvider";
import { RealtimeProvider } from "~/components/providers/RealtimeProvider";
import { SplashScreenController } from "~/components/ui/splash";
import { patchUserExpoPushToken } from "~/endpoints";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import { authClient } from "~/lib/auth-client";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { EntitlementsProvider } from "~/components/providers/EntitlementsProvider";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "ios" || Platform.OS == "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "basketball_swish.wav",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      toast.error(
        "Permission not granted to get push token for push notification!"
      );
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      await patchUserExpoPushToken(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      toast.error(`${e}`);
    }
  } else {
    toast.error("Must use physical device for push notifications");
  }
}

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
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

function useRefreshOnFocus() {
  const firstTimeRef = React.useRef(true);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        if (firstTimeRef.current) {
          firstTimeRef.current = false;
          return;
        }

        queryClient.invalidateQueries();
      }
    });

    return () => subscription.remove();
  }, []);
}

SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    // Only register push notifications if user is signed in
    if (session?.user) {
      registerForPushNotificationsAsync();
    }
  }, [session?.user?.id]); // Re-register when user signs in

  // setting up mobile ads
  useEffect(() => {
    mobileAds()
      .initialize()
      .then((_) => {
        // Initialization complete!
      });
  }, []);

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

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    if (Platform.OS === "ios") {
      Purchases.configure({
        apiKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY!,
      });
    }
  }, []);

  useRefreshOnFocus();

  usePlatformSpecificSetup();
  const { isDarkColorScheme, setColorScheme } = useColorScheme();
  setColorScheme("dark");

  return (
    <React.Fragment>
      <SafeAreaProvider>
        <GestureHandlerRootView>
          <QueryClientProvider client={queryClient}>
            <RealtimeProvider>
              <EntitlementsProvider>
                <ThemeProvider value={DARK_THEME}>
                  <AudioProvider>
                    <SplashScreenController />
                    <RootNavigatior />
                    <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
                  </AudioProvider>
                </ThemeProvider>
              </EntitlementsProvider>
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
            <PortalHost />
          </QueryClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </React.Fragment>
  );
}

export function RootNavigatior() {
  const { data: currentUserData, isPending: isSessionPending } =
    authClient.useSession();

  return (
    <Stack>
      <Stack.Protected guard={isSessionPending}>
        <Stack.Screen
          name="loading"
          options={{
            headerShown: false,
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={currentUserData == null && !isSessionPending}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signin" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={currentUserData !== null && !isSessionPending}>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
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
        <Stack.Screen
          name="users/[id]"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="help"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="create-dynasty-league"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="join-dynasty-league/[dynastyLeagueId]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="dynastyLeague" options={{ headerShown: false }} />
        <Stack.Screen
          name="banner-locker"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="image-locker"
          options={{ headerShown: false, presentation: "modal" }}
        />
      </Stack.Protected>
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

function noop() {}
