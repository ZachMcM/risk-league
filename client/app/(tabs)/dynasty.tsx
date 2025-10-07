import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import { Search } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import BannerAdWrapper from "~/components/ad-wrappers/Banner";
import DynastyLeagueListCard from "~/components/dynasty/DynastyLeagueListCard";
import { Container } from "~/components/ui/container";
import { GridItemWrapper } from "~/components/ui/grid-item-wrapper";
import { Icon } from "~/components/ui/icon";
import { SearchBar } from "~/components/ui/search-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import { getDynastyLeagueIds, searchDynastyLeagues } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function Dynasty() {
  const { data: currentUserData } = authClient.useSession();

  const { data: leagueIds, isPending: areLeaguesPending } = useQuery({
    queryKey: ["dynasty-league-ids", currentUserData?.user.id!],
    queryFn: getDynastyLeagueIds,
  });

  const [tab, setTab] = useState(
    areLeaguesPending
      ? "my-leagues"
      : !leagueIds || leagueIds.length == 0
      ? "discover"
      : "my-leagues"
  );

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    return () => {
      setSearchQuery("")
    }
  }, [])

  const {
    data: searchResults,
    refetch: reSearch,
    isPending: isSearchPending,
  } = useQuery({
    queryKey: ["search-leagues"],
    queryFn: async () => await searchDynastyLeagues(searchQuery),
  });

  const request = debounce(async () => {
    reSearch();
  }, 150);

  const debounceRequest = useCallback(() => {
    request();
  }, []);

  useEffect(() => {
    return () => {
      setSearchQuery("");
    };
  }, []);

  return (
    <Container className="p-0 flex flex-col gap-6">
      <BannerAdWrapper />
      <Tabs className="flex flex-1 flex-col" value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="my-leagues">
            <Text>My Leagues ({leagueIds?.length})</Text>
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Text>Discover</Text>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="my-leagues" className="flex-1">
          {areLeaguesPending ? (
            <ActivityIndicator className="text-foreground p-8" />
          ) : !leagueIds || leagueIds.length == 0 ? (
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
              data={leagueIds}
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingVertical: 16,
              }}
              estimatedItemSize={166}
              renderItem={({ item, index }) => {
                return (
                  <GridItemWrapper index={index} numCols={1} gap={16}>
                    <DynastyLeagueListCard dynastyLeagueId={item} />
                  </GridItemWrapper>
                );
              }}
              keyExtractor={(item) => item.toString()}
            />
          )}
        </TabsContent>
        <TabsContent
          value="discover"
          className="flex flex-1 flex-col gap-4 p-4"
        >
          <SearchBar
            value={searchQuery}
            onChangeText={(val) => {
              setSearchQuery(val);
              debounceRequest();
            }}
            className="bg-input/30 rounded-full"
          />
          {isSearchPending ? (
            <ActivityIndicator className="text-foreground" />
          ) : searchResults?.length == 0 ? (
            <View className="flex flex-col gap-4 items-center">
              <View className="flex flex-col gap-1 items-center">
                <Icon as={Search} size={28} className="text-muted-foreground" />
                <Text className="font-bold text-2xl text-center">
                  {searchQuery === ""
                    ? "Search for Leagues"
                    : "No results found"}
                </Text>
                <Text className="font-semibold text-muted-foreground text-center max-w-sm">
                  {searchQuery === ""
                    ? "Search for dynasty leagues by title or tags"
                    : "Try searching with a different term"}
                </Text>
              </View>
            </View>
          ) : (
            <FlashList
              data={searchResults}
              contentContainerStyle={{
                paddingBottom: 24,
              }}
              estimatedItemSize={60}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <GridItemWrapper index={index} numCols={1} gap={16}>
                  <DynastyLeagueListCard dynastyLeagueId={item.id} />
                </GridItemWrapper>
              )}
              keyExtractor={(item) => `search-${item.id}`}
            />
          )}
        </TabsContent>
      </Tabs>
    </Container>
  );
}
