import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import MatchHeader from "~/components/matches/MatchHeader";

export default function Layout() {
  const searchParams = useLocalSearchParams<{
    matchId: string;
    openSubRoute?: string;
    subRouteId?: string;
  }>();

  useEffect(() => {
    if (searchParams.openSubRoute === "messages") {
      router.navigate({
        pathname: "/match/[matchId]/messages",
        params: { matchId: searchParams.matchId },
      });
    } else if (
      searchParams.openSubRoute == "parlays" &&
      searchParams.subRouteId
    ) {
      router.navigate({
        pathname: "/match/[matchId]/parlays/[parlayId]",
        params: {
          matchId: searchParams.matchId,
          parlayId: searchParams.subRouteId,
        },
      });
    }
  }, [searchParams.openSubRoute, searchParams.matchId, router]);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => <MatchHeader />,
        }}
      />
      <Stack.Screen
        name="messages"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="parlays/[parlayId]"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="props"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
