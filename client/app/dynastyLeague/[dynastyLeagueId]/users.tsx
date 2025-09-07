import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  CornerUpLeft,
  EllipsisVertical,
  ShareIcon
} from "lucide-react-native";
import { ActivityIndicator, Share, View } from "react-native";
import { toast } from "sonner-native";
import BonusUsersDialog from "~/components/dynasty/BonusUsersDialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { GridItemWrapper } from "~/components/ui/grid-item-wrapper";
import { Icon } from "~/components/ui/icon";
import ModalContainer from "~/components/ui/modal-container";
import ProfileImage from "~/components/ui/profile-image";
import { Text } from "~/components/ui/text";
import {
  getDynastyLeague,
  getDynastyLeagueUsers,
  patchDynastyLeagueDemoteUser,
  patchDynastyLeagueKickUser,
  patchDynastyLeaguePromoteUser,
  postDynastLeagueInvite,
} from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { DynastyLeague, DynastyLeagueUser } from "~/types/dynastyLeague";

function UserItem({
  dynastyLeagueUser,
  dynastyLeague,
  currentUserRole,
}: {
  dynastyLeague: DynastyLeague;
  dynastyLeagueUser: DynastyLeagueUser;
  currentUserRole: "member" | "manager" | "owner";
}) {
  const { data: currentUserData } = authClient.useSession();

  const { mutate: promoteUser, isPending: isPromotingUser } = useMutation({
    mutationFn: async () =>
      await patchDynastyLeaguePromoteUser(
        dynastyLeagueUser.dynastyLeagueId,
        dynastyLeagueUser.userId
      ),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: demoteUser, isPending: isDemotingUser } = useMutation({
    mutationFn: async () =>
      await patchDynastyLeagueDemoteUser(
        dynastyLeagueUser.dynastyLeagueId,
        dynastyLeagueUser.userId
      ),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: kickUser, isPending: isKickingUser } = useMutation({
    mutationFn: async () =>
      await patchDynastyLeagueKickUser(
        dynastyLeagueUser.dynastyLeagueId,
        dynastyLeagueUser.userId
      ),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Link
      href={{
        pathname: "/users/[id]",
        params: { id: dynastyLeagueUser.userId },
      }}
      className="w-full"
    >
      <View className="flex flex-row items-center justify-between w-full">
        <View className="flex flex-row items-center gap-3">
          {dynastyLeagueUser.rank && (
            <Text className="text-3xl font-bold">
              {dynastyLeagueUser.rank}.
            </Text>
          )}
          <ProfileImage
            className="h-12 w-12"
            username={dynastyLeagueUser.user.username}
            image={dynastyLeagueUser.user.image!}
          />
          <View className="flex flex-col">
            <Text className="text-muted-foreground text-lg">
              Balance: ${dynastyLeagueUser.balance}
            </Text>
            <View className="flex flex-row items-center gap-2">
              <Badge>
                <Text className="capitalize">{dynastyLeagueUser.role}</Text>
              </Badge>
              <Text className="font-bold">
                {dynastyLeagueUser.user.username}
              </Text>
            </View>
          </View>
        </View>
        {currentUserData?.user.id !== dynastyLeagueUser.userId &&
          currentUserRole !== "member" &&
          (new Date()).toISOString() < dynastyLeague.endDate && dynastyLeagueUser.role !== "owner" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Icon
                    as={EllipsisVertical}
                    className="text-foreground"
                    size={18}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                portalHost="inside-modal-page"
                side="bottom"
                className="mt-2 w-40"
              >
                <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {dynastyLeagueUser.role == "member" && (
                  <DropdownMenuItem
                    onPress={() => promoteUser()}
                    disabled={isPromotingUser}
                    className="flex flex-row items-center gap-2"
                  >
                    {isPromotingUser ? (
                      <ActivityIndicator className="text-foreground" />
                    ) : (
                      <Icon
                        as={ArrowUp}
                        className="text-foreground"
                        size={16}
                      />
                    )}
                    <Text>Promote</Text>
                  </DropdownMenuItem>
                )}
                {dynastyLeagueUser.role == "manager" &&
                  currentUserRole == "owner" && (
                    <DropdownMenuItem
                      onPress={() => demoteUser()}
                      disabled={isDemotingUser}
                      className="flex flex-row items-center gap-2"
                    >
                      {isDemotingUser ? (
                        <ActivityIndicator className="text-foreground" />
                      ) : (
                        <Icon
                          as={ArrowDown}
                          className="text-foreground"
                          size={16}
                        />
                      )}
                      <Text>Demote</Text>
                    </DropdownMenuItem>
                  )}
                {currentUserRole == "owner" &&
                  dynastyLeagueUser.role == "member" && (
                    <DropdownMenuItem
                      onPress={() => kickUser()}
                      disabled={isKickingUser}
                      className="flex flex-row items-center gap-2"
                    >
                      {isKickingUser ? (
                        <ActivityIndicator className="text-foreground" />
                      ) : (
                        <Icon
                          as={CornerUpLeft}
                          className="text-foreground"
                          size={16}
                        />
                      )}
                      <Text>Kick</Text>
                    </DropdownMenuItem>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
      </View>
    </Link>
  );
}

export default function Users() {
  const searchParams = useLocalSearchParams<{
    dynastyLeagueId: string;
  }>();

  const dynastyLeagueId = parseInt(searchParams.dynastyLeagueId);

  const { data: dynastyLeagueUsers, isPending: areUsersPending } = useQuery({
    queryKey: ["dynasty-league", dynastyLeagueId, "users"],
    queryFn: async () => await getDynastyLeagueUsers(dynastyLeagueId),
  });

  const { data: dynastyLeague, isPending: isDynastyLeaguePending } = useQuery({
    queryKey: ["dynasty-league", dynastyLeagueId],
    queryFn: async () => await getDynastyLeague(dynastyLeagueId),
  });

  const { data: currentUserData } = authClient.useSession();

  const { mutate: handleInvite, isPending: isHandlingInvite } = useMutation({
    mutationFn: async () => {
      const newInvite = await postDynastLeagueInvite(dynastyLeagueId);
      const result = await Share.share({
        message: `riskleague://join-dynasty-league/${dynastyLeagueId}?inviteId=${newInvite.id}`,
      });
      if (result.action === Share.dismissedAction) {
        return;
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const currentUserRole = dynastyLeagueUsers?.find(
    (du) => du.userId == currentUserData?.user.id
  )?.role!;

  return (
    <ModalContainer>
      <View className="flex flex-1 flex-col gap-6 px-4 pt-10 pb-20">
        <View className="flex flex-row items-center justify-between">
          <Text className="font-bold text-4xl">Users</Text>
          {currentUserRole !== "member" && (
            <Button
              onPress={() => handleInvite()}
              size="sm"
              variant="foreground"
              disabled={isHandlingInvite}
              className="flex flex-row items-center gap-2 rounded-full h-10"
            >
              {isHandlingInvite ? (
                <ActivityIndicator className="text-background" />
              ) : (
                <Icon as={ShareIcon} className="text-background" size={18} />
              )}
              <Text>Invite User</Text>
            </Button>
          )}
        </View>
        <View className="flex-1">
          {areUsersPending || isDynastyLeaguePending ? (
            <ActivityIndicator className="text-muted-foreground p-4" />
          ) : dynastyLeagueUsers && dynastyLeague ? (
            <View className="flex flex-1 flex-col gap-4">
              <FlashList
                estimatedItemSize={60}
                showsVerticalScrollIndicator={false}
                data={dynastyLeagueUsers}
                renderItem={({ item, index }) => (
                  <GridItemWrapper index={index} gap={20} numCols={1}>
                    <UserItem
                      dynastyLeague={dynastyLeague}
                      currentUserRole={currentUserRole}
                      dynastyLeagueUser={item}
                    />
                  </GridItemWrapper>
                )}
                keyExtractor={(item) => `${item.id}`}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
              {new Date().toISOString() < dynastyLeague.endDate && (
                <BonusUsersDialog dynastyLeagueId={dynastyLeagueId} />
              )}
            </View>
          ) : (
            <View className="flex items-center justify-center flex-1">
              <Text className="text-muted-foreground text-center">
                No players found on this page.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ModalContainer>
  );
}
