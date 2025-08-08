import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FriendlyMatchRequestCard } from "~/components/social/FriendlyMatchRequestCard";
import { UserCard } from "~/components/social/UserCard";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import ModalContainer from "~/components/ui/modal-container";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { SearchBar } from "~/components/ui/search-bar";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import { getFriendlyMatchRequests, getFriends, getUsers } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { Search } from "~/lib/icons/Search";

import { cn } from "~/utils/cn";
import { formatCompactNumber } from "~/utils/formatCompactNumber";

export default function Friends() {
  const { data } = authClient.useSession();
  const searchParams = useLocalSearchParams<{ tab?: string }>();

  const { data: friendships, isPending: areFriendshipsPending } = useQuery({
    queryKey: ["friendships", data?.user.id!],
    queryFn: getFriends,
  });

  const friends = friendships?.filter(
    (friendship) => friendship.status == "accepted"
  );
  const friendRequests = friendships?.filter(
    (friendship) =>
      friendship.status == "pending" && friendship.incomingId == data?.user.id!
  );

  const {
    data: friendlyMatchRequests,
    isPending: areFriendlyMatchRequestsPending,
  } = useQuery({
    queryKey: ["friendly-match-requests", data?.user.id!],
    queryFn: getFriendlyMatchRequests,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: searchResults,
    refetch: reSearch,
    isPending: isSearchPending,
  } = useQuery({
    queryKey: ["search"],
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
      setTabsValue(searchParams.tab)
    }
  }, [searchParams.tab])

  const [tabsValue, setTabsValue] = useState(searchParams.tab ?? "friends");

  return (
    <ModalContainer>
      <View className="flex flex-col gap-4 px-4 pt-6 flex-1">
        <View className="flex flex-col gap-1">
          <Text className="font-bold text-4xl">Social</Text>
          <Text className="font-semibold text-lg text-muted-foreground w-4/5">
            View and manage your friends
          </Text>
        </View>
        {areFriendlyMatchRequestsPending ? (
          <ActivityIndicator className="text-foreground" />
        ) : (
          friendlyMatchRequests &&
          friendlyMatchRequests.map((request) => (
            <FriendlyMatchRequestCard
              friendlyMatchRequest={request}
              key={request.id}
            />
          ))
        )}
        <Tabs
          value={tabsValue}
          onValueChange={setTabsValue}
          className="flex-col gap-4 flex-1 flex"
        >
          <TabsList className="flex-row w-full">
            <TabsTrigger value="friends" className="flex-1">
              <Text>
                Friends {friends && `(${formatCompactNumber(friends.length)})`}
              </Text>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1">
              <Text>
                Requests{" "}
                {friendRequests &&
                  `(${formatCompactNumber(friendRequests.length)})`}
              </Text>
            </TabsTrigger>
            <TabsTrigger
              value="search"
              className="flex-1 flex flex-row items-center gap-2"
            >
              <Text>Search</Text>
              <Search
                className={cn(
                  tabsValue == "search"
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                size={18}
              />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="flex flex-1 flex-col gap-4">
            <SearchBar
              value={searchQuery}
              onChangeText={(val) => {
                setSearchQuery(val);
                debounceRequest();
              }}
            />
            {isSearchPending ? (
              <ActivityIndicator className="text-foreground" />
            ) : searchResults?.length == 0 ? (
              <View className="flex flex-col gap-4 p-4 items-center">
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
              <FlatList
                contentContainerClassName="flex flex-col gap-4 pb-16"
                className="flex-1"
                data={searchResults}
                renderItem={({ item }) => (
                  <UserCard
                    user={item}
                    friendship={friendships?.find(
                      (friendship) => friendship.friend.id == item.id
                    )}
                  />
                )}
                keyExtractor={(item) => item.id}
              />
            )}
          </TabsContent>
          <TabsContent value="requests" className="flex-1">
            {areFriendshipsPending ? (
              <ActivityIndicator className="text-foreground p-4" />
            ) : !friendRequests || friendRequests.length == 0 ? (
              <View className="flex flex-col gap-4 p-4 items-center">
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
              <FlatList
                contentContainerClassName="flex flex-col gap-4 pb-16"
                className="flex-1"
                data={friendRequests}
                renderItem={({ item }) => (
                  <UserCard friendship={item} user={item.friend} />
                )}
                keyExtractor={(item) => item.friend.id}
              />
            )}
          </TabsContent>
          <TabsContent value="friends" className="flex-1">
            {areFriendshipsPending ? (
              <ActivityIndicator className="text-foreground" />
            ) : !friends || friends.length == 0 ? (
              <View className="flex flex-col gap-4 p-4 items-center">
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
              <FlatList
                contentContainerClassName="flex flex-col gap-4 pb-16"
                className="flex-1"
                data={friends}
                renderItem={({ item }) => (
                  <UserCard friendship={item} user={item.friend} />
                )}
                keyExtractor={(item) => item.friend.id}
              />
            )}
          </TabsContent>
        </Tabs>
      </View>
    </ModalContainer>
  );
}
