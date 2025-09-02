import { useQuery } from "@tanstack/react-query";
import { Pressable, View } from "react-native";
import { getTodayProps } from "~/endpoints";
import { League } from "~/lib/config";
import { Play } from "~/lib/icons/Play";
import { Card, CardContent } from "../ui/card";
import LeagueLogo from "../ui/league-logos/LeagueLogo";
import { Skeleton } from "../ui/skeleton";
import { Text } from "../ui/text";

export default function FriendlyMatchPlayCard({
  league,
  callbackFn,
}: {
  league: League;
  callbackFn: () => void;
}) {
  const { data: props, isPending: arePropsPending } = useQuery({
    queryKey: ["props", league],
    queryFn: async () => await getTodayProps({ league }),
    staleTime: 1440 * 60 * 1000,
  });

  const uniqueGameIds = [...new Set(props?.map((prop) => prop.game.gameId))];

  return arePropsPending ? (
    <Skeleton className="w-[48%] self-stretch h-40" />
  ) : (
    props && props.length > 0 && (
      <Pressable
        key={league}
        className="w-[48%] self-stretch"
        onPress={callbackFn}
      >
        <Card>
          <CardContent className="flex flex-col gap-2 items-center p-6">
            <LeagueLogo size={42} league={league} />
            <Text className="font-bold text-2xl text-center uppercase">
              {league}
            </Text>
            <Text className="text-muted-foreground text-center">
              {arePropsPending ? "..." : props?.length} Props •{" "}
              {arePropsPending ? "..." : uniqueGameIds.length} Games
            </Text>
            <View className="rounded-full bg-primary h-9 w-9 flex items-center justify-center">
              <Play className="text-foreground" size={14} />
            </View>
          </CardContent>
        </Card>
      </Pressable>
    )
  );
}
