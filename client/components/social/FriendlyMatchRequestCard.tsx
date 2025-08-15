import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, View } from "react-native";
import { toast } from "sonner-native";
import { patchFriendlyMatchRequest } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { Check } from "~/lib/icons/Check";
import { X } from "~/lib/icons/X";
import { FriendlyMatchRequest } from "~/types/match";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import LeagueLogo from "../ui/league-logos/LeagueLogo";
import { Text } from "../ui/text";

export function FriendlyMatchRequestCard({
  friendlyMatchRequest,
}: {
  friendlyMatchRequest: FriendlyMatchRequest;
}) {
  const { data } = authClient.useSession();
  const isIncomingUser = data?.user.id == friendlyMatchRequest.incomingId;

  const queryClient = useQueryClient();

  const {
    mutate: declineFriendlyMatchRequest,
    isPending: isFriendlyMatchRequestDeclining,
  } = useMutation({
    mutationFn: async () =>
      await patchFriendlyMatchRequest(friendlyMatchRequest.id, "declined"),
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendly-match-requests", data?.user.id!],
      });
    },
  });

  const {
    mutate: acceptFriendlyMatchRequest,
    isPending: isFriendlyMatchRequestAccepting,
  } = useMutation({
    mutationFn: async () =>
      await patchFriendlyMatchRequest(friendlyMatchRequest.id, "accepted"),
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendly-match-requests", data?.user.id!],
      });
    },
  });

  return (
    <Card className="animate-pulse">
      <CardContent className="p-4 flex flex-row items-center justify-between w-full">
        <View className="flex flex-row items-center gap-4 flex-1">
          <LeagueLogo league={friendlyMatchRequest.league} size={36} />
          <View className="flex flex-col flex-1">
            <Text className="font-bold">
              {friendlyMatchRequest.league.toUpperCase()} Friendly Match{" "}
              {isIncomingUser && `from ${friendlyMatchRequest.friend.username}`}
            </Text>
            <Text className="font-semibold text-muted-foreground">
              Waiting for{" "}
              {isIncomingUser ? "you" : friendlyMatchRequest.friend.username}...
            </Text>
          </View>
        </View>
        <View className="flex flex-col gap-2">
          {isIncomingUser && (
            <Button
              size="sm"
              variant="foreground"
              className="flex flex-row items-center gap-1"
              onPress={() => acceptFriendlyMatchRequest()}
            >
              {isFriendlyMatchRequestAccepting ? (
                <ActivityIndicator className="text-background" />
              ) : (
                <Check className="text-background" size={18} />
              )}
              <Text>Accept</Text>
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            className="flex flex-row items-center gap-1"
            onPress={() => declineFriendlyMatchRequest()}
          >
            {isFriendlyMatchRequestDeclining ? (
              <ActivityIndicator className="text-destructive-foreground" />
            ) : (
              <X className="text-destructive-foreground" size={18} />
            )}
            <Text>
              {isIncomingUser
                ? isFriendlyMatchRequestDeclining
                  ? "Declining"
                  : "Decline"
                : isFriendlyMatchRequestDeclining
                  ? "Canceling"
                  : "Cancel"}
            </Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );
}
