import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment } from "react";
import { ActivityIndicator, View } from "react-native";
import { toast } from "sonner-native";
import {
  deleteFriendship,
  getFriendship,
  getUser,
  patchFriendRequest,
  postFriendRequest
} from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { Check } from "~/lib/icons/Check";
import { UserMinus } from "~/lib/icons/UserMinus";
import { UserPlus } from "~/lib/icons/UserPlus";
import { X } from "~/lib/icons/X";
import { User } from "~/types/user";
import { invalidateQueries } from "~/utils/invalidateQueries";
import { Button } from "../ui/button";
import { Text } from "../ui/text";
import FriendlyMatchDialog from "./FriendlyMatchDialog";

export default function FriendshipButtons({
  user,
  portalHost,
}: {
  user: User;
  portalHost?: string;
}) {
  const queryClient = useQueryClient();

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

  const { mutate: sendFriendRequest, isPending: isSendingRequest } =
    useMutation({
      mutationFn: async () => await postFriendRequest(user.id),
      onError: (err) => {
        toast.error(err.message, {
          position: "bottom-center",
        });
      },
      onSuccess: () => {
        invalidateQueries(
          queryClient,
          ["friendships", currUserData?.user.id],
          ["friendship", currUserData?.user.id, user.id]
        );
      },
    });

  const { mutate: removeFriendship, isPending: isRemovingFriendship } =
    useMutation({
      mutationFn: async () => await deleteFriendship(user.id),
      onError: (err) => {
        toast.error(err.message, {
          position: "bottom-center",
        });
      },
      onSuccess: () => {
        invalidateQueries(
          queryClient,
          ["friendships", currUserData?.user.id],
          ["friendship", currUserData?.user.id, user.id]
        );
      },
    });

  const { mutate: acceptFriendRequest, isPending: isAcceptingFriendship } =
    useMutation({
      mutationFn: async () => await patchFriendRequest(user.id),
      onError: (err) => {
        toast.error(err.message, {
          position: "bottom-center",
        });
      },
      onSuccess: () => {
        invalidateQueries(
          queryClient,
          ["friendships", currUserData?.user.id],
          ["friendship", currUserData?.user.id, user.id]
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
            <FriendlyMatchDialog user={userProfile} portalHost={portalHost} />
            <Button
              variant="outline"
              size="icon"
              disabled={isRemovingFriendship}
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
              disabled={isRemovingFriendship}
              onPress={() => removeFriendship()}
            >
              <X className="text-foreground" size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={isAcceptingFriendship}
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
          disabled={isSendingRequest}
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
