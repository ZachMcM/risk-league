import { Pressable, View } from "react-native";
import { League } from "~/lib/config";
import { Card, CardContent } from "../ui/card";
import LeagueLogo from "../ui/league-logos/LeagueLogo";
import { Text } from "../ui/text";
import { Play } from "~/lib/icons/Play";
import { useQuery } from "@tanstack/react-query";
import { getTodayProps } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { Skeleton } from "../ui/skeleton";

export default function FriendlyMatchPlayCard({
  league,
  callbackFn,
}: {
  league: League;
  callbackFn: () => void;
}) {
  const { data } = authClient.useSession();

  const { data: props, isPending: arePropsPending } = useQuery({
    queryKey: ["props", league, data?.user.id, "friendly"],
    queryFn: async () => await getTodayProps(league, false),
    staleTime: 1440 * 60 * 1000,
  });

  return arePropsPending ? (
    <Skeleton className="w-[48%] self-stretch" />
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
            <View className="rounded-full bg-primary h-9 w-9 flex items-center justify-center">
              <Play className="text-foreground" size={14} />
            </View>
          </CardContent>
        </Card>
      </Pressable>
    )
  );
}
