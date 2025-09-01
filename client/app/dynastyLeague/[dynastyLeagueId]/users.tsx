import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { Crown, Ellipsis, EllipsisVertical } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { GridItemWrapper } from "~/components/ui/grid-item-wrapper";
import { Icon } from "~/components/ui/icon";
import ModalContainer from "~/components/ui/modal-container";
import ProfileImage from "~/components/ui/profile-image";
import { Text } from "~/components/ui/text";
import { getDynastyLeague, getDynastyLeagueUsers } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { DynastyLeagueUser } from "~/types/dynastyLeague";

function UserItem({
  dynastyLeagueUser,
  index,
}: {
  dynastyLeagueUser: DynastyLeagueUser;
  index: number;
}) {
  const { data: currentUserData } = authClient.useSession();

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
          <Badge variant={index == 0 ? "success" : "default"}>
            <Text className="text-lg">#{index + 1}.</Text>
          </Badge>
          <ProfileImage
            className="h-12 w-12"
            username={dynastyLeagueUser.user.username}
            image={dynastyLeagueUser.user.image!}
          />
          <View className="flex flex-col">
            <Text className="font-bold text-lg">
              {dynastyLeagueUser.user.username}
            </Text>
            <Text className="text-muted-foreground">
              Balance: ${dynastyLeagueUser.balance}
            </Text>
          </View>
        </View>
        {currentUserData?.user.id !== dynastyLeagueUser.userId && (
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
              className="mt-2"
            >
              <DropdownMenuItem className="justify-center">
                <Icon as={Crown} size={18} />
                <Text>Promote</Text>
              </DropdownMenuItem>
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

  return (
    <ModalContainer>
      <View className="flex flex-1 flex-col gap-6 px-4 pt-10 pb-20">
        <Text className="font-bold text-4xl">Users</Text>
        <View className="flex-1">
          {areUsersPending ? (
            <ActivityIndicator className="text-muted-foreground p-4" />
          ) : dynastyLeagueUsers ? (
            <FlashList
              estimatedItemSize={60}
              showsVerticalScrollIndicator={false}
              data={dynastyLeagueUsers}
              renderItem={({ item, index }) => (
                <GridItemWrapper index={index} gap={20} numCols={1}>
                  <UserItem index={index} dynastyLeagueUser={item} />
                </GridItemWrapper>
              )}
              keyExtractor={(item) => `${item.id}`}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
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
