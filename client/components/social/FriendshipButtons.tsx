import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { toast } from "sonner-native";
import {
  deleteFriendship,
  getFriendship,
  getUser,
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
import { User } from "~/types/user";
import { invalidateQueries } from "~/utils/invalidateQueries";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import ProfileImage from "../ui/profile-image";
import { Text } from "../ui/text";
import FriendlyMatchPlayCard from "./FriendlyMatchPlayCard";

export default function FriendshipButtons({
  user,
  portalHost,
}: {
  user: User;
  portalHost?: string;
}) {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: currUserData } = authClient.useSession();

  const { data: userProfile } = useQuery({
    queryKey: ["user", user.id],
    queryFn: async () => await getUser(user.id),
    initialData: user,
  });

  const { data: friendship, isPending: isfriendshipPending } = useQuery({
    queryKey: ["friendship", currUserData?.user.id, user.id],
    queryFn: async () => await getFriendship(user.id),
  });

  const { mutate: sendFriendRequest } = useMutation({
    mutationFn: async () => await postFriendRequest(user.id),
    onError: (err) => {
      toast.error(err.message, {
        position: "bottom-center",
      });
    },
    onSettled: () => {
      invalidateQueries(
        queryClient,
        ["friendships", currUserData?.user.id],
        ["friendship", currUserData?.user.id, user.id]
      );
    },
  });

  const { mutate: removeFriendship } = useMutation({
    mutationFn: async () => await deleteFriendship(user.id),
    onError: (err) => {
      toast.error(err.message, {
        position: "bottom-center",
      });
    },
    onSettled: () => {
      invalidateQueries(
        queryClient,
        ["friendships", currUserData?.user.id],
        ["friendship", currUserData?.user.id, user.id]
      );
    },
  });

  const { mutate: acceptFriendRequest } = useMutation({
    mutationFn: async () => await patchFriendRequest(user.id),
    onError: (err) => {
      toast.error(err.message, {
        position: "bottom-center",
      });
    },
    onSettled: () => {
      invalidateQueries(
        queryClient,
        ["friendships", currUserData?.user.id],
        ["friendship", currUserData?.user.id, user.id]
      );
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
        queryKey: ["friendly-match-requests", currUserData?.user.id!],
      });

      const previousRequests = queryClient.getQueryData([
        "friendly-match-requests",
        currUserData?.user.id!,
      ]);

      queryClient.setQueryData(
        ["friendly-match-requests", currUserData?.user.id!],
        (old: FriendlyMatchRequest[]) => [
          ...(old || []),
          {
            id: Math.round(Math.random() * 100),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            incomingId,
            league,
            outgoingId: currUserData?.user.id!,
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
        ["friendly-match-requests", currUserData?.user.id!],
        context?.previousRequests
      );
    },
  });

  return (
    <Fragment>
      {isfriendshipPending ? (
        <ActivityIndicator className="text-foreground p-4" />
      ) : friendship ? (
        friendship.status == "accepted" ? (
          <View className="flex flex-row items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="flex px-4 flex-row gap-1.5 items-center rounded-full"
                >
                  <Text className="font-semibold !text-sm">Play</Text>
                  <Play className="text-primary-foreground" size={14} />
                </Button>
              </DialogTrigger>
              <DialogContent portalHost={portalHost} className="w-[375px]">
                <View className="flex flex-col gap-6">
                  <View className="flex flex-row items-center gap-3">
                    <ProfileImage
                      className="h-12 w-12"
                      username={userProfile.username}
                      image={userProfile.image!}
                    />
                    <View className="flex flex-col">
                      <Text className="font-bold text-lg">
                        {userProfile.username}
                      </Text>
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
        ) : friendship.status == "pending" &&
          friendship.incomingId == currUserData?.user.id ? (
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
        ) : (
          friendship.status == "pending" &&
          friendship.outgoingId == currUserData?.user.id && (
            <Button variant="outline" size="sm" disabled>
              <Text className="text-muted-foreground">Request Sent</Text>
            </Button>
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
    </Fragment>
  );
}
