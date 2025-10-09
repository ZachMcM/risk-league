import * as Notifications from "expo-notifications";
import { router, Tabs } from "expo-router";
import { useEffect } from "react";
import DynastyHeader from "~/components/dynasty/DynastyHeader";
import PageHeader from "~/components/ui/page-header";
import { BATTLE_PASS_NAME } from "~/lib/config";
import { NAV_THEME } from "~/lib/constants";
import { Contact } from "~/lib/icons/Contact";
import { Dices } from "~/lib/icons/Dices";
import { Gift } from "~/lib/icons/Gift";
import { Home } from "~/lib/icons/Home";
import { ShieldHalf } from "~/lib/icons/ShieldHalf";
import { useColorScheme } from "~/lib/useColorScheme";

function useNotificationObserver() {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (typeof url === "string") {
        if (router.canDismiss()) {
          router.dismiss();
        }
        router.navigate(url as any);
      }
    }

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);
}

export default function TabsLayout() {
  const { isDarkColorScheme } = useColorScheme();

  useNotificationObserver()  

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "hsl(var(--background))",
          borderTopColor: "hsl(var(--border))",
          borderTopWidth: 1,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
        tabBarActiveTintColor: NAV_THEME.dark.primary, // from --primary
        tabBarInactiveTintColor: isDarkColorScheme
          ? "hsl(223.8136 0% 63.0163%)" // from --muted-foreground .dark:root
          : "hsl(223.8136 0% 45.1519%)", // from --muted-foreground .root
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          header: () => <PageHeader title="Matches" />,
          tabBarIcon: ({ color }) => <Dices size={22} color={color} />,
        }}
      />
      {/* TODO complete dynasty post launch */}
      {/* <Tabs.Screen
        name="dynasty"
        options={{
          title: "Dynasty",
          header: () => <DynastyHeader />,
          tabBarIcon: ({ color }) => <ShieldHalf size={22} color={color} />,
        }}
      /> */}
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          header: () => <PageHeader title="Social" />,
          tabBarIcon: ({ color }) => <Contact size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="battle-pass"
        options={{
          title: "Battle Pass",
          header: () => <PageHeader title={BATTLE_PASS_NAME} />,
          tabBarIcon: ({ color }) => <Gift size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
