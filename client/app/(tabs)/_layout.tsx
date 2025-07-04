import { Tabs, useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogoIcon } from "~/components/ui/logo-icon";
import PageTitle from "~/components/ui/page-title";
import { Text } from "~/components/ui/text";
import { Dices } from "~/lib/icons/Dices";
import { Home } from "~/lib/icons/Home";
import { useColorScheme } from "~/lib/useColorScheme";

export default function TabsLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
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
          header: (_) => (
            <View
              style={{ marginTop: insets.top }}
              className="flex flex-row justify-center gap-2 p-4"
            >
              <View className="flex flex-row  items-center gap-2">
                <LogoIcon className="h-6 w-6 text-primary"/>
                <Text className="font-extrabold text-xl text-primary">Risk League</Text>
              </View>
            </View>
          ),
          tabBarIcon: ({ color }) => <Home color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          headerShown: false,
          tabBarIcon: ({ color }) => <Dices color={color} />,
        }}
      />
    </Tabs>
  );
}
