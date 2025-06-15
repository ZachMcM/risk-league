import { useSession } from "@/components/providers/SessionProvider";
import { HapticTab } from "@/components/ui/HapticTab";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

export default function TabLayout() {
  const { session, isSessionPending } = useSession();

  return isSessionPending ? (
    <View>
      <Text>Loading...</Text>
    </View>
  ) : session ? (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
    </Tabs>
  ) : (
    <Redirect href={"/signup"} />
  );
}
