import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { FriendlyMatchRequestCard } from "~/components/social/FriendlyMatchRequestCard";
import { UserCard } from "~/components/social/UserCard";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { GridItemWrapper } from "~/components/ui/grid-item-wrapper";
import { SearchBar } from "~/components/ui/search-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import { getFriendlyMatchRequests, getFriends, getUsers } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { Search } from "~/lib/icons/Search";
import { formatCompactNumber } from "~/utils/formatCompactNumber";

export default function Friends() {
  const { data: currentUserData } = authClient.useSession();
  const searchParams = useLocalSearchParams<{ tab?: string }>();

  const { data: friendships, isPending: areFriendshipsPending } = useQuery({
    queryKey: ["friendships", currentUserData?.user.id!],
    queryFn: getFriends,
  });

  const friends = friendships?.filter(
    (friendship) => friendship.status == "accepted"
  );
  const friendRequests = friendships?.filter(
    (friendship) =>
      friendship.status == "pending" &&
      friendship.incomingId == currentUserData?.user.id!
  );

  const { data: friendlyMatchRequests } = useQuery({
    queryKey: ["friendly-match-requests", currentUserData?.user.id!],
    queryFn: getFriendlyMatchRequests,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: searchResults,
    refetch: reSearch,
    isPending: isSearchPending,
  } = useQuery({
    queryKey: ["search-users"],
    queryFn: async () => await getUsers(searchQuery),
  });

  const request = debounce(async () => {
    reSearch();
  }, 150);

  const debounceRequest = useCallback(() => {
    request();
  }, []);

  useEffect(() => {
    if (searchParams.tab) {
      setTabsValue(searchParams.tab);
    }
  }, [searchParams.tab]);

  useEffect(() => {
    setSearchQuery("");
  }, []);

  const [tabsValue, setTabsValue] = useState(searchParams.tab ?? "friends");

  return (
    <Container className="pt-4 pb-0 px-0">
      <View className="flex flex-col gap-4 flex-1">
        {friendlyMatchRequests?.length !== 0 && (
          <View className="flex flex-col gap-2 px-4">
            {friendlyMatchRequests &&
              friendlyMatchRequests.map((request) => (
                <FriendlyMatchRequestCard
                  friendlyMatchRequest={request}
                  key={`friendly-match-${request.id}`}
                />
              ))}
          </View>
        )}
        <Tabs
          value={tabsValue}
          onValueChange={setTabsValue}
          className="flex-col flex-1 flex"
        >
          <TabsList>
            <TabsTrigger value="friends">
              <Text>
                Friends {friends && `(${formatCompactNumber(friends.length)})`}
              </Text>
            </TabsTrigger>
            <TabsTrigger value="requests">
              <Text>
                Requests{" "}
                {friendRequests &&
                  `(${formatCompactNumber(friendRequests.length)})`}
              </Text>
            </TabsTrigger>
            <TabsTrigger value="search">
              <Text>Search</Text>
              <Search className="text-muted-foreground" size={16} />
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="search"
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
                  <Search size={28} className="text-muted-foreground" />
                  <Text className="font-bold text-2xl text-center">
                    {searchQuery === ""
                      ? "Search for friends"
                      : "No results found"}
                  </Text>
                  <Text className="font-semibold text-muted-foreground text-center max-w-sm">
                    {searchQuery === ""
                      ? "Enter a username to find people"
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
                    <UserCard user={item} />
                  </GridItemWrapper>
                )}
                keyExtractor={(item) => `search-${item.id}`}
              />
            )}
          </TabsContent>
          <TabsContent value="requests" className="flex-1">
            {areFriendshipsPending ? (
              <ActivityIndicator className="text-foreground p-8" />
            ) : !friendRequests || friendRequests.length == 0 ? (
              <View className="flex flex-col gap-4 p-8 items-center">
                <View className="flex flex-col gap-1 items-center">
                  <Text className="font-bold text-2xl text-center">
                    No Requests
                  </Text>
                  <Text className="font-semibold text-muted-foreground text-center max-w-sm">
                    You don't have any pending friend requests currently
                  </Text>
                </View>
              </View>
            ) : (
              <FlashList
                contentContainerStyle={{
                  paddingHorizontal: 12,
                  paddingVertical: 16,
                }}
                estimatedItemSize={60}
                showsVerticalScrollIndicator={false}
                data={friendRequests}
                renderItem={({ item, index }) => (
                  <GridItemWrapper index={index} numCols={1} gap={16}>
                    <UserCard user={item.friend} />
                  </GridItemWrapper>
                )}
                keyExtractor={(item) => `request-${item.friend.id}`}
              />
            )}
          </TabsContent>
          <TabsContent value="friends" className="flex-1">
            {areFriendshipsPending ? (
              <ActivityIndicator className="text-foreground p-8" />
            ) : !friends || friends.length == 0 ? (
              <View className="flex flex-col gap-4 p-8 items-center">
                <View className="flex flex-col gap-4 items-center">
                  <View className="flex flex-col gap-1 items-center">
                    <Text className="font-bold text-2xl text-center">
                      No Friends
                    </Text>
                    <Text className="font-semibold text-muted-foreground text-center max-w-sm">
                      You don't have any friends currently. Put your self out
                      there!
                    </Text>
                  </View>
                  <Button
                    onPress={() => setTabsValue("search")}
                    variant="foreground"
                  >
                    <Text className="font-semibold">Find Friends</Text>
                  </Button>
                </View>
              </View>
            ) : (
              <FlashList
                data={friends}
                contentContainerStyle={{
                  paddingHorizontal: 12,
                  paddingVertical: 16,
                }}
                estimatedItemSize={60}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <GridItemWrapper index={index} gap={16} numCols={1}>
                    <UserCard user={item.friend} />
                  </GridItemWrapper>
                )}
                keyExtractor={(item) => `friend-${item.friend.id}`}
              />
            )}
          </TabsContent>
        </Tabs>
      </View>
    </Container>
  );
}
