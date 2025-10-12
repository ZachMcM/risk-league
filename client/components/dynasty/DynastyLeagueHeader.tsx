import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getDynastyLeague } from "~/endpoints";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import LeagueLogo from "../ui/league-logo";
import { Skeleton } from "../ui/skeleton";
import { Text } from "../ui/text";

export default function DynastyLeagueHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const searchParams = useLocalSearchParams<{
    dynastyLeagueId: string;
    openSubRoute?: string;
    subRouteId?: string;
  }>();
  const dynastyLeagueId = parseInt(searchParams.dynastyLeagueId);

  const { data: league, isPending } = useQuery({
    queryKey: ["dynastyLeague", dynastyLeagueId],
    queryFn: async () => await getDynastyLeague(dynastyLeagueId),
  });

  return (
    <Pressable
      style={{
        marginTop: insets.top,
      }}
      onPress={() => router.back()}
      className="flex flex-row items-center gap-1 px-3 py-4"
    >
      <ChevronLeft size={20} className="text-foreground" />
      <Text className="text-xl font-semibold">Back</Text>
    </Pressable>
  );
}
