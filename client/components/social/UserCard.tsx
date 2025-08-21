import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";
import {
  deleteFriendship,
  patchFriendRequest,
  postFriendlyMatchRequest,
  postFriendRequest,
} from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { League, LEAGUES } from "~/lib/config";
import { Check } from "~/lib/icons/Check";
import { Play } from "~/lib/icons/Play";
import { UserMinus } from "~/lib/icons/UserMinus";
import { UserPlus } from "~/lib/icons/UserPlus";
import { X } from "~/lib/icons/X";
import { FriendlyMatchRequest } from "~/types/match";
import { Friendship, User } from "~/types/user";
import RankBadge from "../ui/RankBadge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import ProfileImage from "../ui/profile-image";
import { Text } from "../ui/text";
import FriendlyMatchPlayCard from "./FriendlyMatchPlayCard";

export function UserCard({
  user,
  friendship,
}: {
  user: User;
  friendship?: Friendship;
}) {
  const { data } = authClient.useSession();
  console.log(friendship);

  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutate: sendFriendRequest } = useMutation({
    mutationFn: async () => await postFriendRequest(user.id),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["friendships", data?.user.id],
      });

      // Snapshot the previous value
      const previousFriendships = queryClient.getQueryData<Friendship[]>([
        "friendships",
        data?.user.id,
      ]);

      // Optimistically update to the new value
      const newFriendship: Friendship = {
        friend: user,
        status: "pending",
        outgoingId: data?.user.id!,
        incomingId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Friendship[]>(
        ["friendships", data?.user.id],
        (old) => [...(old || []), newFriendship]
      );

      // Return a context object with the snapshotted value
      return { previousFriendships };
    },
    onError: (err, _, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        ["friendships", data?.user.id],
        context?.previousFriendships
      );
      toast.error(err.message, {
        position: "bottom-center",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendships", data?.user.id],
      });
    },
  });

  const { mutate: removeFriendship } = useMutation({
    mutationFn: async () => await deleteFriendship(user.id),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["friendships", data?.user.id],
      });

      // Snapshot the previous value
      const previousFriendships = queryClient.getQueryData<Friendship[]>([
        "friendships",
        data?.user.id,
      ]);

      // Optimistically update to the new value by removing the friendship
      queryClient.setQueryData<Friendship[]>(
        ["friendships", data?.user.id],
        (old) => (old || []).filter((f) => f.friend.id !== user.id)
      );

      // Return a context object with the snapshotted value
      return { previousFriendships };
    },
    onError: (err, _, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        ["friendships", data?.user.id],
        context?.previousFriendships
      );
      toast.error(err.message, {
        position: "bottom-center",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendships", data?.user.id],
      });
    },
  });

  const { mutate: acceptFriendRequest } = useMutation({
    mutationFn: async () => await patchFriendRequest(user.id),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["friendships", data?.user.id],
      });

      // Snapshot the previous value
      const previousFriendships = queryClient.getQueryData<Friendship[]>([
        "friendships",
        data?.user.id,
      ]);

      // Optimistically update to the new value by changing status to accepted
      queryClient.setQueryData<Friendship[]>(
        ["friendships", data?.user.id],
        (old) =>
          (old || []).map((f) =>
            f.friend.id === user.id ? { ...f, status: "accepted" as const } : f
          )
      );

      // Return a context object with the snapshotted value
      return { previousFriendships };
    },
    onError: (err, _, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        ["friendships", data?.user.id],
        context?.previousFriendships
      );
      toast.error(err.message, {
        position: "bottom-center",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendships", data?.user.id],
      });
    },
  });

  const { mutate: sendFriendlyMatchRequest } = useMutation({
    mutationFn: async ({
      incomingId,
      league,
    }: {
      incomingId: string;
      league: League;
    }) => {
      await postFriendlyMatchRequest(incomingId, league);
    },
    onMutate: async ({ league, incomingId }) => {
      await queryClient.cancelQueries({
        queryKey: ["friendly-match-requests", data?.user.id!],
      });

      const previousRequests = queryClient.getQueryData([
        "friendly-match-requests",
        data?.user.id!,
      ]);

      queryClient.setQueryData(
        ["friendly-match-requests", data?.user.id!],
        (old: FriendlyMatchRequest[]) => [
          ...(old || []),
          {
            id: Math.round(Math.random() * 100),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            incomingId,
            league,
            outgoingId: data?.user.id!,
            friend: user,
            status: "pending",
          },
        ]
      );

      setDialogOpen(false);

      return { previousRequests };
    },
    onError: (err, _, context) => {
      console.log(err);
      toast.error("There was an error sending your friendly match request");
      queryClient.setQueryData(
        ["friendly-match-requests", data?.user.id!],
        context?.previousRequests
      );
    },
  });

  return (
    <View className="flex flex-row items-center justify-between">
      <View className="flex flex-row items-center gap-3">
        <ProfileImage
          className="h-14 w-14"
          username={user.username}
          image={user.image}
        />
        <View className="flex flex-col gap-2">
          <Text className="font-bold text-lg">{user.username}</Text>
          <RankBadge
            iconClassName="h-4 w-4"
            textClassName="text-xs"
            gradientStyle={{
              paddingHorizontal: 8,
              gap: 4,
              alignSelf: "flex-start",
            }}
            rank={user.rank}
            showIcon
          />
        </View>
      </View>
      {friendship ? (
        friendship.status == "accepted" ? (
          <View className="flex flex-row items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1 px-5 flex flex-row items-center rounded-full"
                >
                  <Text className="font-semibold">Play</Text>
                  <Play className="text-primary-foreground" size={16} />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[375px]">
                <View className="flex flex-col gap-6">
                  <View className="flex flex-row items-center gap-3">
                    <ProfileImage
                      className="h-12 w-12"
                      username={user.username}
                      image={user.image}
                    />
                    <View className="flex flex-col">
                      <Text className="font-bold text-lg">{user.username}</Text>
                      <Text className="text-muted-foreground">
                        Request to play a friendly match!
                      </Text>
                    </View>
                  </View>
                  <Text className="font-bold text-xl">Choose a League</Text>
                  <View className="flex flex-row items-center gap-3 flex-wrap">
                    {LEAGUES.map((league) => (
                      <FriendlyMatchPlayCard
                        key={league}
                        league={league}
                        callbackFn={() =>
                          sendFriendlyMatchRequest({
                            league,
                            incomingId: user.id,
                          })
                        }
                      />
                    ))}
                  </View>
                </View>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="icon"
              onPress={() => removeFriendship()}
            >
              <UserMinus size={18} className="text-foreground" />
            </Button>
          </View>
        ) : (
          friendship.status == "pending" &&
          friendship.incomingId == data?.user.id && (
            <View className="flex flex-row items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onPress={() => removeFriendship()}
              >
                <X className="text-foreground" size={18} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onPress={() => acceptFriendRequest()}
              >
                <Check className="text-foreground" size={18} />
              </Button>
            </View>
          )
        )
      ) : (
        <Button
          onPress={() => sendFriendRequest()}
          variant="outline"
          size="icon"
        >
          <UserPlus className="text-foreground" size={18} />
        </Button>
      )}
    </View>
  );
}
