import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import DynastyLeagueHeader from "~/components/dynasty/DynastyLeagueHeader";
import { getDynastyLeague } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function Layout() {
  const searchParams = useLocalSearchParams<{
    dynastyLeagueId: string;
    openSubRoute?: string;
    subRouteId?: string;
  }>();
  const dynastyLeagueId = parseInt(searchParams.dynastyLeagueId);

  useEffect(() => {
    if (searchParams.openSubRoute === "messages") {
      router.navigate({
        pathname: "/dynastyLeague/[dynastyLeagueId]/messages",
        params: { dynastyLeagueId: searchParams.dynastyLeagueId },
      });
    } else if (
      searchParams.openSubRoute == "parlays" &&
      searchParams.subRouteId
    ) {
      router.navigate({
        pathname: "/dynastyLeague/[dynastyLeagueId]/parlays/[parlayId]",
        params: {
          dynastyLeagueId: searchParams.dynastyLeagueId,
          parlayId: searchParams.subRouteId,
        },
      });
    }
  }, [searchParams.openSubRoute, searchParams.dynastyLeagueId, router]);

  const { data: dynastyLeague, isPending: isDynastyLeaguePending } = useQuery({
    queryKey: ["dynasty-league", dynastyLeagueId],
    queryFn: async () => await getDynastyLeague(dynastyLeagueId),
  });

  const { data: currentUserData } = authClient.useSession();

  useEffect(() => {
    if (!isDynastyLeaguePending) {
      if (
        dynastyLeague?.dynastyLeagueUsers.find(
          (du) => du.userId == currentUserData?.user.id
        ) === undefined
      ) {
        if (router.canDismiss()) {
          router.dismiss();
        }
        if (router.canGoBack()) {
          router.back();
        } else {
          router.navigate("/(tabs)");
        }
      }
    }
  }, [dynastyLeague]);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => <DynastyLeagueHeader />,
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
        name="users"
        options={{ headerShown: false, presentation: "modal" }}
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
