import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import PropsView from "~/components/props/PropsView";
import { Container } from "~/components/ui/container";
import { getDynastyLeague, getTodayProps } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function Props() {
  const searchParams = useLocalSearchParams<{
    dynastyLeagueId: string;
  }>();
  const dynastyLeagueId = parseInt(searchParams.dynastyLeagueId);
  const { data: currentUserData } = authClient.useSession();

  const { data: dynastyLeague, isPending: isDynastyLeaguePending } = useQuery({
    queryKey: ["dynasty-league", dynastyLeagueId],
    queryFn: async () => await getDynastyLeague(dynastyLeagueId),
  });

  const { data: props, isPending: arePropsPending } = useQuery({
    queryKey: [
      "props",
      "dynasty-league",
      dynastyLeagueId,
      currentUserData?.user.id,
    ],
    queryFn: async () =>
      await getTodayProps({
        dynastyLeagueId,
      }),
    staleTime: 1440 * 60 * 1000,
  });

  return (
    <Container className="py-0">
      <View className="flex flex-col gap-4 flex-1">
        {arePropsPending || isDynastyLeaguePending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          props &&
          dynastyLeague && (
            <PropsView props={props} league={dynastyLeague.league} />
          )
        )}
      </View>
    </Container>
  );
}
