import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { toast } from "sonner-native";
import { Button } from "~/components/ui/button";
import ModalContainer from "~/components/ui/modal-container";
import ProfileImage from "~/components/ui/profile-image";
import RankBadge from "~/components/ui/RankBadge";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { SearchBar } from "~/components/ui/search-bar";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import {
  deleteFriendship,
  getFriends,
  getUsers,
  patchFriendRequest,
  postFriendRequest,
} from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { Check } from "~/lib/icons/Check";
import { Dices } from "~/lib/icons/Dices";
import { Search } from "~/lib/icons/Search";
import { UserMinus } from "~/lib/icons/UserMinus";
import { UserPlus } from "~/lib/icons/UserPlus";
import { Friendship, User } from "~/types/user";
import { cn } from "~/utils/cn";
import { formatCompactNumber } from "~/utils/formatCompactNumber";

export default function Friends() {
  const { data } = authClient.useSession();

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

  const [tabsValue, setTabsValue] = useState("friends");

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
            <TabsContent value="friends"></TabsContent>
            <TabsContent value="requests"></TabsContent>
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
              {
                (searchResults?.length == 0 && (
                  <View className="flex flex-col gap-4 p-4 items-center">
                    <View className="flex flex-col gap-1 items-center">
                      <Search size={28} className="text-muted-foreground"/>
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
                ))}
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

function UserCard({
  user,
  friendship,
}: {
  user: User;
  friendship?: Friendship;
}) {
  const { data } = authClient.useSession();

  console.log(friendship);

  const queryClient = useQueryClient();

  const {
    mutate: sendFriendRequest,
    isPending: isSendingFriendRequestPending,
  } = useMutation({
    mutationFn: async () => await postFriendRequest(user.id),
    onError: (err) => {
      toast.error(err.message, {
        position: "bottom-center",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendships", data?.user.id],
      });
    },
  });

  const { mutate: removeFriendship, isPending: isRemovingFriendshipPending } =
    useMutation({
      mutationFn: async () => await deleteFriendship(user.id),
      onError: (err) => {
        toast.error(err.message, {
          position: "bottom-center",
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["friendships", data?.user.id],
        });
      },
    });

  const {
    mutate: acceptFriendRequest,
    isPending: isAcceptingFriendRequestPending,
  } = useMutation({
    mutationFn: async () => await patchFriendRequest(user.id),
    onError: (err) => {
      toast.error(err.message, {
        position: "bottom-center",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendships", data?.user.id],
      });
    },
  });

  return (
    <View className="flex flex-row items-center justify-between">
      <View className="flex flex-row items-center gap-4">
        <ProfileImage
          className="h-16 w-16"
          username={user.username}
          image={user.image}
        />
        <View className="flex flex-col gap-2">
          <Text className="font-bold text-xl">{user.username}</Text>
          <RankBadge
            iconClassName="h-4 w-4"
            textClassName="text-sm"
            gradientStyle={{
              paddingHorizontal: 10,
              gap: 4,
            }}
            rank={user.rank}
            showIcon
          />
        </View>
      </View>
      {friendship ? (
        friendship.status == "accepted" ? (
          <View className="flex flex-row items-center gap-2">
            <Button
              variant="outline"
              className="flex flex-row items-center gap-2"
            >
              <Dices size={18} className="text-foreground" />
              <Text>Play</Text>
            </Button>
            <Button
              onPress={() => removeFriendship()}
              variant="outline"
              size="icon"
            >
              {isRemovingFriendshipPending ? (
                <ActivityIndicator className="text-foreground" />
              ) : (
                <UserMinus className="text-foreground" size={18} />
              )}
            </Button>
          </View>
        ) : (
          friendship.status == "pending" &&
          friendship.incomingId == data?.user.id && (
            <Button
              variant="outline"
              size="icon"
              onPress={() => acceptFriendRequest()}
            >
              {isAcceptingFriendRequestPending ? (
                <ActivityIndicator className="text-foreground" />
              ) : (
                <Check className="text-foreground" size={18} />
              )}
            </Button>
          )
        )
      ) : (
        <Button
          onPress={() => sendFriendRequest()}
          variant="outline"
          size="icon"
        >
          {isSendingFriendRequestPending ? (
            <ActivityIndicator className="text-foreground" />
          ) : (
            <UserPlus className="text-foreground" size={18} />
          )}
        </Button>
      )}
    </View>
  );
}

export function getLoadingSkeletons(length: number) {
  return Array(length)
    .fill("")
    .map((_, i) => <Skeleton key={i} className="w-full h-16" />);
}
