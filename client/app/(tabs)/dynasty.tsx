import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import DynastyLeagueListCard from "~/components/dynasty/DynastyLeagueListCard";
import { Container } from "~/components/ui/container";
import { GridItemWrapper } from "~/components/ui/grid-item-wrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import { getDynastyLeagueInvites, getDynastyLeagues } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function Dynasty() {
  const { data: currentUserData } = authClient.useSession();

  const { data: leagues, isPending: areLeaguesPending } = useQuery({
    queryKey: ["dynasty-leagues", currentUserData?.user.id!],
    queryFn: getDynastyLeagues,
  });

  const { data: invites, isPending: areInvitesPending } = useQuery({
    queryKey: ["dynasty-league-invitations", currentUserData?.user.id!],
    queryFn: getDynastyLeagueInvites,
  });

  const [tab, setTab] = useState(
    areLeaguesPending
      ? "my-leagues"
      : !leagues || leagues.length == 0
      ? "discover"
      : "my-leagues"
  );

  return (
    <Container className="pt-4 pb-0 px-0">
      <Tabs
        className="flex flex-1 flex-col"
        value={tab}
        onValueChange={setTab}
      >
        <TabsList>
          <TabsTrigger value="my-leagues">
            <Text>My Leagues ({leagues?.length})</Text>
          </TabsTrigger>
          <TabsTrigger value="invites">
            <Text>Invites ({invites?.length})</Text>
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Text>Discover</Text>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="my-leagues" className="flex-1">
          {areLeaguesPending ? (
            <ActivityIndicator className="text-foreground p-8" />
          ) : !leagues || leagues.length == 0 ? (
            <View className="flex flex-col gap-4 p-8 items-center">
              <View className="flex flex-col gap-1 items-center">
                <Text className="font-bold text-2xl text-center">
                  No Leagues
                </Text>
                <Text className="font-semibold text-muted-foreground text-center max-w-sm">
                  You don't have any leagues currently
                </Text>
              </View>
            </View>
          ) : (
            <FlashList
              showsVerticalScrollIndicator={false}
              data={leagues}
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingVertical: 16
              }}
              estimatedItemSize={166}
              renderItem={({ item, index }) => (
                <GridItemWrapper index={index} numCols={1} gap={16}>
                  <DynastyLeagueListCard initialData={item} />
                </GridItemWrapper>
              )}
              keyExtractor={(item) => item.id.toString()}
            />
          )}
        </TabsContent>
      </Tabs>
    </Container>
  );
}
