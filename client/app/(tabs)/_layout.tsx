import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageTitle from "~/components/ui/page-title";
import { NAV_THEME } from "~/lib/constants";
import { Dices } from "~/lib/icons/Dices";
import { Home } from "~/lib/icons/Home";
import { Info } from "~/lib/icons/Info";
import { Contact } from "~/lib/icons/Contact";
import { useColorScheme } from "~/lib/useColorScheme";

export default function TabsLayout() {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "hsl(var(--background))",
          borderTopColor: "hsl(var(--border))",
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
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
          tabBarIcon: ({ color }) => <Home color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          header: () => <PageTitle title="Matches" />,
          tabBarIcon: ({ color }) => <Dices color={color} />,
          href: "/(tabs)/matches",
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          header: () => <PageTitle title="Social" />,
          tabBarIcon: ({ color }) => <Contact color={color} />,
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: "Help",
          header: () => <PageTitle title="Help" />,
          tabBarIcon: ({ color }) => <Info color={color} />,
        }}
      />
    </Tabs>
  );
}
