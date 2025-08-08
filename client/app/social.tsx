import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { debounce } from "lodash";
import { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { FriendlyMatchRequestCard } from "~/components/social/FriendlyMatchRequestCard";
import { UserCard } from "~/components/social/UserCard";
import { Button } from "~/components/ui/button";
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

  const [tabsValue, setTabsValue] = useState(searchParams.tab ?? "friends");

  return (
    <ModalContainer>
      <ScrollContainer className="pt-6">
        <View className="flex flex-col gap-4">
          <View className="flex flex-col gap-1">
            <Text className="font-bold text-4xl">Social</Text>
            <Text className="font-semibold text-lg text-muted-foreground w-4/5">
              View and manage your friends
            </Text>
          </View>
          {areFriendlyMatchRequestsPending ? (
            <ActivityIndicator className="text-foreground" />
          ) : (
            friendlyMatchRequests && (
              <View className="flex flex-col gap-2">
                {friendlyMatchRequests.map((request) => (
                  <FriendlyMatchRequestCard key={request.id} friendlyMatchRequest={request} />
                ))}
              </View>
            )
          )}
          <Tabs
            value={tabsValue}
            onValueChange={setTabsValue}
            className="flex-col gap-4"
          >
            <TabsList className="flex-row w-full">
              <TabsTrigger value="friends" className="flex-1">
                <Text>
                  Friends{" "}
                  {friends && `(${formatCompactNumber(friends.length)})`}
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
            <TabsContent value="search" className="flex flex-col gap-4">
              <SearchBar
                value={searchQuery}
                onChangeText={(val) => {
                  setSearchQuery(val);
                  debounceRequest();
                }}
                placeholder="Search for users..."
              />
              {isSearchPending
                ? getLoadingSkeletons(3)
                : searchResults?.map((user) => (
                    <UserCard
                      friendship={friendships?.find(
                        (friendship) => friendship.friend.id == user.id
                      )}
                      key={user.id}
                      user={user}
                    />
                  ))}
              {searchResults?.length == 0 && (
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
              )}
            </TabsContent>
            <TabsContent value="requests" className="flex flex-col gap-4">
              {areFriendshipsPending ? (
                getLoadingSkeletons(3)
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
                friendRequests?.map((friendship) => (
                  <UserCard
                    key={friendship.friend.id}
                    friendship={friendship}
                    user={friendship.friend}
                  />
                ))
              )}
            </TabsContent>
            <TabsContent value="friends" className="flex flex-col gap-4">
              {areFriendshipsPending ? (
                getLoadingSkeletons(3)
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
                friends.map((friendship) => (
                  <UserCard
                    key={friendship.friend.id}
                    friendship={friendship}
                    user={friendship.friend}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </View>
      </ScrollContainer>
    </ModalContainer>
  );
}

export function getLoadingSkeletons(length: number) {
  return Array(length)
    .fill("")
    .map((_, i) => <Skeleton key={i} className="w-full h-16" />);
}
