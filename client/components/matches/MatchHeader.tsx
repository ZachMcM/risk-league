import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LeagueLogo from "../ui/league-logos/LeagueLogo";
import { Text } from "../ui/text";
import { getMatch } from "~/endpoints";
import { useQuery } from "@tanstack/react-query";

export default function MatchHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const searchParams = useLocalSearchParams<{
    matchId: string;
    openSubRoute?: string;
    subRouteId?: string;
  }>();
  const matchId = parseInt(searchParams.matchId);

  const { data: match } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => await getMatch(matchId),
  });

  return (
    <View
      className="flex flex-row items-center gap-2 p-4"
      style={{
        marginTop: insets.top,
      }}
    >
      <Pressable onPress={() => router.back()}>
        <ChevronLeft size={18} className="text-foreground" />
      </Pressable>
      {match && (
        <View className="flex flex-row items-center gap-1.5">
          <View className="flex flex-row items-center gap-2">
            <LeagueLogo league={match.league} size={26} />
            <Text className="text-lg uppercase font-bold">{match.league}</Text>
          </View>
          <Text className="font-semibold text-muted-foreground capitalize text-lg">
            {match.type} Match
          </Text>
        </View>
      )}
    </View>
  );
}
