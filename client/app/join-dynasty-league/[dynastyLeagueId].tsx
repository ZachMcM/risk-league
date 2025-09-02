import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { toast } from "sonner-native";
import { patchDynastyLeagueJoin } from "~/endpoints";

export default function JoinDynastyLeague() {
  const searchParams = useLocalSearchParams<{
    inviteId?: string;
    dynastyLeagueId?: string;
  }>();

  if (!searchParams.inviteId || !searchParams.dynastyLeagueId) {
    router.navigate("/(tabs)");
  }

  const { mutate } = useMutation({
    mutationFn: async () =>
      await patchDynastyLeagueJoin({
        dynastyLeagueId: parseInt(searchParams.dynastyLeagueId!),
        inviteId: searchParams.inviteId!,
      }),
    onSuccess: () => {
      toast.success("Successfully joined the league");
      router.navigate({
        pathname: "/dynastyLeague/[dynastyLeagueId]",
        params: { dynastyLeagueId: parseInt(searchParams.dynastyLeagueId!) },
      });
    },
    onError: (error) => {
      toast.error(error.message);
      router.navigate("/(tabs)");
    },
  });

  useEffect(() => {
    mutate();
  }, []);

  return (
    <View className="flex flex-1 justify-center items-center">
      <ActivityIndicator className="text-foreground" size="large" />
    </View>
  );
}
