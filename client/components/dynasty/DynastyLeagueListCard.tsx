import { DynastyLeague } from "~/types/dynastyLeague";
import { Card, CardContent } from "../ui/card";
import { useQuery } from "@tanstack/react-query";
import { getDynastyLeague } from "~/endpoints";
import { View } from "react-native";
import LeagueLogo from "../ui/league-logos/LeagueLogo";
import { Text } from "../ui/text";
import { Badge } from "../ui/badge";
import { Icon } from "../ui/icon";
import { Calendar, LockIcon, Users } from "lucide-react-native";
import { Separator } from "../ui/separator";
import moment from "moment";
import { Fragment } from "react";

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

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6 items-start">
        <View className="flex flex-row w-full items-start justify-between">
          <View className="flex flex-col gap-3">
            <View className="flex flex-col">
              <View className="flex flex-row items-center gap-3">
                <View className="flex flex-row items-center gap-2">
                  <LeagueLogo league={league.league} />
                  <Text className="font-bold uppercase text-lg">
                    {league.league}
                  </Text>
                </View>
                <View className="flex flex-row items-center gap-2">
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
              <Text className="font-bold text-3xl">{league.title}</Text>
            </View>
            <View className="flex flex-row items-center gap-2">
              {league.tags.map((tag, i) => (
                <Badge variant="foreground" key={i}>
                  <Text>{tag}</Text>
                </Badge>
              ))}
            </View>
          </View>
          <Badge>
            <Text className="text-sm">
              {league.resolved ? "Completed" : "Active"}
            </Text>
          </Badge>
        </View>
        <Separator />
        <View className="flex flex-row items-center justify-between w-full">
          <View className="flex flex-row items-center gap-2">
            <Icon as={Calendar} className="text-foreground" size={16} />
            <Text className="text-foreground text-lg">
              {moment(league.startDate).format("M/D/Y")} -{" "}
              {moment(league.endDate).format("M/D/Y")}
            </Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            <Icon as={Users} className="text-muted-foreground" size={16} />
            <Text className="text-muted-foreground">{league.userCount}</Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
