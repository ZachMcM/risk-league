import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "~/components/providers/SessionProvider";
import { Dices } from "~/lib/icons/Dices";
import { Home } from "~/lib/icons/Home";
import { useColorScheme } from "~/lib/useColorScheme";

export default function TabsLayout() {
  const { session, isSessionPending } = useSession();

  const { isDarkColorScheme } = useColorScheme();

  return isSessionPending ? (
    <View className="flex flex-1 justify-center items-center">
      <ActivityIndicator size="large" />
    </View>
  ) : !session ? (
    <Redirect href="/landing" />
  ) : (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "hsl(var(--background))",
          borderTopColor: "hsl(var(--border))",
          borderTopWidth: 1,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarActiveTintColor: "hsl(324.9505 80.8% 50.9804%)", // from --primary
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
        name="matches/index"
        options={{
          title: "Matches",
          headerShown: false,
          tabBarIcon: ({ color }) => <Dices color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
