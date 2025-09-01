import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  MessageCircle,
  Plus,
  Trophy,
} from "lucide-react-native";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { toast } from "sonner-native";
import DynastyLeagueDetails from "~/components/dynasty/DynastyLeagueDetails";
import ParlaysView from "~/components/parlays/ParlaysView";
import { Alert, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
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
import { MIN_PARLAYS_REQUIRED, MIN_PCT_TOTAL_STAKED } from "~/lib/config";

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

  console.log(parlays);

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
          <View className="flex flex-1 flex-col gap-6">
            <View className="flex flex-row items-center justify-between gap-4">
              <View className="flex flex-col gap-2 max-w-xs">
                <View className="flex flex-row items-center gap-2">
                  <LeagueLogo league={dynastyLeague.league} size={28} />
                  <Text className="text-xl uppercase font-bold">
                    {dynastyLeague.league}
                  </Text>
                </View>
                <Text className="text-4xl font-bold">
                  {dynastyLeague.title}
                </Text>
                <View className="flex flex-row items-center gap-4">
                  <View className="flex flex-row items-center gap-2 flex-wrap">
                    {dynastyLeague.tags.map((tag, i) => (
                      <Badge variant="foreground" key={i}>
                        <Text>{tag}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              </View>
              <View className="flex flex-row items-center gap-2">
                <Button
                  className="h-10 w-10"
                  size="icon"
                  variant="outline"
                  onPress={() =>
                    router.navigate({
                      pathname: "/dynastyLeague/[dynastyLeagueId]/messages",
                      params: { dynastyLeagueId: dynastyLeagueId },
                    })
                  }
                >
                  <Icon as={Trophy} size={16} className="text-foreground" />
                </Button>
                <Button
                  className="h-10 w-10"
                  size="icon"
                  variant="outline"
                  onPress={() =>
                    router.navigate({
                      pathname: "/dynastyLeague/[dynastyLeagueId]/messages",
                      params: { dynastyLeagueId: dynastyLeagueId },
                    })
                  }
                >
                  <Icon
                    as={MessageCircle}
                    size={16}
                    className="text-foreground"
                  />
                </Button>
              </View>
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
            <View className="flex flex-col gap-4">
              <View className="flex flex-row items-end justify-between">
                <Text className="font-bold text-2xl">Parlays</Text>
                {!dynastyLeague.resolved && (
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
