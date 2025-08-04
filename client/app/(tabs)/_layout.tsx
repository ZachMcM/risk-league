import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageTitle from "~/components/ui/page-title";
import { NAV_THEME } from "~/lib/constants";
import { Dices } from "~/lib/icons/Dices";
import { Home } from "~/lib/icons/Home";
import { Trophy } from "~/lib/icons/Trophy";
import { Tv } from "~/lib/icons/Tv";
import { useColorScheme } from "~/lib/useColorScheme";

export default function TabsLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "hsl(var(--background))",
          borderTopColor: "hsl(var(--border))",
          borderTopWidth: 1,
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
        name="leaderboard"
        options={{
          title: "Leaderboard",
          header: () => <PageTitle title="Leaderboard" />,
          tabBarIcon: ({ color }) => <Trophy color={color} />,
        }}
      />
      <Tabs.Screen
        name="scores"
        options={{
          title: "Scores",
          header: () => <PageTitle title="Scores" />,
          tabBarIcon: ({ color }) => <Tv color={color} />,
        }}
      />
    </Tabs>
  );
}
