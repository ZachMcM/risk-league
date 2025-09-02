import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MessageCircle, Plus, Users } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";
import DynastyLeagueCountdown from "~/components/dynasty/DynastyLeagueCountdown";
import DynastyLeagueDetails from "~/components/dynasty/DynastyLeagueDetails";
import ParlaysView from "~/components/parlays/ParlaysView";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import LeagueLogo from "~/components/ui/league-logos/LeagueLogo";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import {
  getDynastyLeague,
  getDynastyLeagueUsers,
  getParlays,
  getTodayProps,
} from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function DynastyLeague() {
  const searchParams = useLocalSearchParams<{
    dynastyLeagueId: string;
    openSubRoute?: string;
    subRouteId?: string;
  }>();
  const dynastyLeagueId = parseInt(searchParams.dynastyLeagueId);
  const { data: currentUserData } = authClient.useSession();

  const router = useRouter();

  const { data: dynastyLeague, isPending: isDynastyLeaguePending } = useQuery({
    queryKey: ["dynasty-league", dynastyLeagueId],
    queryFn: async () => await getDynastyLeague(dynastyLeagueId),
  });

  const { data: parlays, isPending: areParlaysPending } = useQuery({
    queryKey: [
      "parlays",
      "dynasty-league",
      dynastyLeagueId,
      currentUserData?.user.id,
    ],
    queryFn: async () => await getParlays({ dynastyLeagueId }),
  });

  const queryClient = useQueryClient();

  queryClient.prefetchQuery({
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
  });

  const { data: dynastyLeagueUsers, isPending: areUsersPending } = useQuery({
    queryKey: ["dynasty-league", dynastyLeagueId, "users"],
    queryFn: async () => await getDynastyLeagueUsers(dynastyLeagueId),
  });

  return (
    <ScrollContainer className="pt-4">
      {isDynastyLeaguePending || areUsersPending ? (
        <ActivityIndicator className="text-foreground" />
      ) : (
        dynastyLeague && (
          <View className="flex flex-1 flex-col gap-8">
            <View className="flex flex-col gap-3">
              <View className="flex flex-col gap-1">
                <View className="flex flex-row items-center gap-2">
                  <LeagueLogo league={dynastyLeague.league} size={28} />
                  <Text className="text-xl uppercase font-bold">
                    {dynastyLeague.league}
                  </Text>
                </View>
                <Text className="text-4xl font-bold">
                  {dynastyLeague.title}
                </Text>
              </View>
              {areUsersPending ? (
                <ActivityIndicator className="text-foreground" />
              ) : (
                dynastyLeagueUsers && (
                  <DynastyLeagueDetails
                    dynastyLeague={dynastyLeague}
                    dynastyLeagueUsers={dynastyLeagueUsers}
                  />
                )
              )}
            </View>
            <View className="flex flex-row items-center gap-2">
              <Button
                className="flex h-9 flex-row items-center gap-2"
                size="sm"
                variant="outline"
                onPress={() =>
                  router.navigate({
                    pathname: "/dynastyLeague/[dynastyLeagueId]/users",
                    params: { dynastyLeagueId: dynastyLeagueId },
                  })
                }
              >
                <Text>Users</Text>
                <Icon as={Users} size={16} className="text-foreground" />
              </Button>
              <Button
                className="flex h-9 flex-row items-center gap-2"
                size="sm"
                variant="outline"
                onPress={() =>
                  router.navigate({
                    pathname: "/dynastyLeague/[dynastyLeagueId]/messages",
                    params: { dynastyLeagueId: dynastyLeagueId },
                  })
                }
              >
                <Text>Messages</Text>
                <Icon
                  as={MessageCircle}
                  size={16}
                  className="text-foreground"
                />
              </Button>
            </View>
            <DynastyLeagueCountdown
              startDate={dynastyLeague.startDate}
              endDate={dynastyLeague.endDate}
            />
            <View className="flex flex-col gap-4">
              <View className="flex flex-row items-end justify-between">
                <Text className="font-bold text-2xl">Parlays</Text>
                {new Date().toISOString() < dynastyLeague.endDate &&
                  new Date().toISOString() > dynastyLeague.startDate && (
                    <Button
                      onPress={() =>
                        router.navigate({
                          pathname: "/dynastyLeague/[dynastyLeagueId]/props",
                          params: { dynastyLeagueId },
                        })
                      }
                      variant="foreground"
                      size="sm"
                      className="flex flex-row items-center gap-2 rounded-full h-10"
                    >
                      <Icon as={Plus} className="text-background" size={18} />
                      <Text>Create Parlay</Text>
                    </Button>
                  )}
              </View>
              {areParlaysPending ? (
                <ActivityIndicator className="text-foreground p-4" />
              ) : (
                parlays && <ParlaysView parlays={parlays} />
              )}
            </View>
          </View>
        )
      )}
    </ScrollContainer>
  );
}
