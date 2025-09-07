import { Tabs } from "expo-router";
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
      <Tabs.Screen
        name="dynasty"
        options={{
          title: "Dynasty",
          header: () => <DynastyHeader />,
          tabBarIcon: ({ color }) => <ShieldHalf size={22} color={color} />,
        }}
      />
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
