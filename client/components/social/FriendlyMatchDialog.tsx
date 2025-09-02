import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LandPlot } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";
import { getTodayProps, postFriendlyMatchRequest } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { League, LEAGUES } from "~/lib/config";
import { FriendlyMatchRequest } from "~/types/match";
import { User } from "~/types/user";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Icon } from "../ui/icon";
import ProfileImage from "../ui/profile-image";
import { Text } from "../ui/text";
import FriendlyMatchPlayCard from "./FriendlyMatchPlayCard";

export default function FriendlyMatchDialog({
  portalHost,
  user,
}: {
  portalHost?: string;
  user: User;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: currentUserData } = authClient.useSession();

  const { data: mlbProps } = useQuery({
    queryKey: ["props", "MLB"],
    queryFn: async () =>
      await getTodayProps({
        league: "MLB",
      }),
    staleTime: 1440 * 60 * 1000,
  });

  const { data: nbaProps } = useQuery({
    queryKey: ["props", "NBA"],
    queryFn: async () =>
      await getTodayProps({
        league: "NBA",
      }),
    staleTime: 1440 * 60 * 1000,
  });

  const { data: nflProps } = useQuery({
    queryKey: ["props", "NFL"],
    queryFn: async () =>
      await getTodayProps({
        league: "NFL",
      }),
    staleTime: 1440 * 60 * 1000,
  });

  const { data: ncaafbProps } = useQuery({
    queryKey: ["props", "NCAAFB"],
    queryFn: async () =>
      await getTodayProps({
        league: "NCAAFB",
      }),
    staleTime: 1440 * 60 * 1000,
  });

  const { data: ncaabbProps } = useQuery({
    queryKey: ["props", "NCAABB"],
    queryFn: async () =>
      await getTodayProps({
        league: "NCAABB",
      }),
    staleTime: 1440 * 60 * 1000,
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
        queryKey: ["friendly-match-requests", currentUserData?.user.id!],
      });

      const previousRequests = queryClient.getQueryData([
        "friendly-match-requests",
        currentUserData?.user.id!,
      ]);

      queryClient.setQueryData(
        ["friendly-match-requests", currentUserData?.user.id!],
        (old: FriendlyMatchRequest[]) => [
          ...(old || []),
          {
            id: Math.round(Math.random() * 100),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            incomingId,
            league,
            outgoingId: currentUserData?.user.id!,
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
        ["friendly-match-requests", currentUserData?.user.id!],
        context?.previousRequests
      );
    },
  });

  if (
    nbaProps?.length == 0 &&
    nflProps?.length == 0 &&
    mlbProps?.length == 0 &&
    ncaabbProps?.length == 0 &&
    ncaafbProps?.length == 0
  ) {
    return null;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="foreground"
          size="sm"
          className="flex flex-row items-center gap-2 rounded-full"
        >
          <Icon as={LandPlot} className="text-background" size={16} />
          <Text>Start Match</Text>
        </Button>
      </DialogTrigger>
      <DialogContent portalHost={portalHost} className="w-[375px]">
        <View className="flex flex-col gap-6">
          <View className="flex flex-row items-center gap-3">
            <ProfileImage
              className="h-12 w-12"
              username={user.username}
              image={user.image!}
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
  );
}
