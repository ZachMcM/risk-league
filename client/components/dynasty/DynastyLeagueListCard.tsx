import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ArrowRight, Calendar, LockIcon, Users } from "lucide-react-native";
import moment from "moment";
import { ActivityIndicator, Pressable, View } from "react-native";
import { getDynastyLeague, patchDynastyLeagueJoin } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { DynastyLeague } from "~/types/dynastyLeague";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Icon } from "../ui/icon";
import LeagueLogo from "../ui/league-logos/LeagueLogo";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";
import { toast } from "sonner-native";

export default function DynastyLeagueListCard({
  initialData,
}: {
  initialData: DynastyLeague;
}) {
  const { data: league } = useQuery({
    queryKey: ["dynasty-league", initialData.id],
    queryFn: async () => await getDynastyLeague(initialData.id),
    initialData,
  });

  const { mutate: joinLeague, isPending: isJoiningLeague } = useMutation({
    mutationFn: async () =>
      await patchDynastyLeagueJoin({ dynastyLeagueId: league.id }),
    onSuccess: () => {
      toast.success(`Joined ${league.title}`);
      router.navigate({
        pathname: "/dynastyLeague/[dynastyLeagueId]",
        params: { dynastyLeagueId: league.id },
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { data: currentUserData } = authClient.useSession();

  const isMember =
    league.dynastyLeagueUsers.find(
      (du) => du.userId == currentUserData?.user.id!
    ) !== undefined;

  return (
    <Pressable
      onPress={() => {
        if (isMember) {
          router.navigate({
            pathname: "/dynastyLeague/[dynastyLeagueId]",
            params: { dynastyLeagueId: league.id },
          });
        }
      }}
    >
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 items-start">
          <View className="flex flex-row w-full items-start justify-between">
            <View className="flex flex-col gap-3">
              <View className="flex flex-col gap-1">
                <View className="flex flex-row items-center gap-3">
                  <View className="flex flex-row items-center gap-2">
                    <LeagueLogo league={league.league} />
                    <Text className="font-bold uppercase text-lg">
                      {league.league}
                    </Text>
                  </View>
                  <View className="flex flex-row items-center gap-1">
                    {league.inviteOnly && (
                      <Icon
                        as={LockIcon}
                        className="text-muted-foreground"
                        size={16}
                      />
                    )}
                    <Text className="text-muted-foreground">
                      {league.inviteOnly ? "Invite Only" : "Open"}
                    </Text>
                  </View>
                </View>
                <Text className="font-bold text-2xl">{league.title}</Text>
              </View>
              <View className="flex flex-row items-center gap-2 flex-wrap">
                {league.tags.map((tag, i) => (
                  <Badge variant="foreground" key={i}>
                    <Text>{tag}</Text>
                  </Badge>
                ))}
              </View>
            </View>
            <Badge>
              <Text className="text-sm">
                {new Date().toISOString() < league.endDate
                  ? "Active"
                  : "Completed"}
              </Text>
            </Badge>
          </View>
          <View className="flex flex-row items-center gap-2">
            <Icon as={Calendar} className="text-muted-foreground" size={16} />
            <Text className="text-muted-foreground">
              {moment(league.startDate).format("M/D/Y")} -{" "}
              {moment(league.endDate).format("M/D/Y")}
            </Text>
          </View>
          <Separator />
          <View className="flex flex-row items-center justify-between w-full">
            <View className="flex flex-row items-center gap-2">
              <Icon as={Users} className="text-muted-foreground" size={18} />
              <Text className="text-muted-foreground text-lg">
                {league.userCount} User{league.userCount != 1 && "s"}
              </Text>
            </View>
            {!isMember &&
              !league.inviteOnly &&
              new Date().toISOString() < league.endDate &&
              league.dynastyLeagueUsers.length < 50 && (
                <Button
                  onPress={() => joinLeague()}
                  disabled={isJoiningLeague}
                  className="flex flex-row items-center gap-1"
                  size="sm"
                  variant="foreground"
                >
                  <Text>Join</Text>
                  {isJoiningLeague ? (
                    <ActivityIndicator className="text-background" />
                  ) : (
                    <Icon
                      size={16}
                      as={ArrowRight}
                      className="text-background"
                    />
                  )}
                </Button>
              )}
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}
