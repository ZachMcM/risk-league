import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "~/components/ui/button";
import { GridItemWrapper } from "~/components/ui/grid-item-wrapper";
import ModalContainer from "~/components/ui/modal-container";
import ProfileImage from "~/components/ui/profile-image";
import { RankText } from "~/components/ui/rank-text";
import RankBadge from "~/components/ui/RankBadge";
import { Text } from "~/components/ui/text";
import { getLeaderboardPage } from "~/endpoints";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import { ChevronRight } from "~/lib/icons/ChevronRight";
import { User } from "~/types/user";

function LeaderboardItem({
  user,
}: {
  user: User & {
    position: number;
    progression: number;
    points?: number;
    wins: number;
  };
}) {
  console.log(user.username);

  return (
    <View className="flex flex-col gap-4">
      <View className="flex flex-row items-center gap-3">
        <Text className="font-bold text-3xl">{user.position}.</Text>
        <ProfileImage
          className="h-14 w-14"
          username={user.username}
          image={user.image}
        />
        <View className="flex flex-col gap-2 flex-1">
          <Text className="font-bold text-lg">{user.username}</Text>
          <View className="flex flex-row items-center justify-between flex-1">
            <View className="flex flex-row items-center gap-2">
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
              {user.points && (
                <RankText tier={user.rank.tier} className="font-bold text-sm">
                  {user.points} points
                </RankText>
              )}
            </View>
            <View className="flex flex-row items-center gap-1.5">
              <Text className="text-muted-foreground font-semibold">Wins:</Text>
              <Text className="font-semibold">{user.wins}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function Leaderboard() {
  const insets = useSafeAreaInsets();

  const [currentPage, setCurrentPage] = useState(1);

  const { data: leaderboard, isPending } = useQuery({
    queryKey: ["leaderboard", currentPage],
    queryFn: () => getLeaderboardPage(currentPage),
  });

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (leaderboard?.pagination.totalPages || 1)) {
      setCurrentPage(page);
    }
  };

  const renderPaginationButtons = () => {
    if (!leaderboard) return null;

    const { page, totalPages } = leaderboard.pagination;
    const buttons = [];

    // Previous button
    buttons.push(
      <Button
        size="icon"
        key="prev"
        variant="outline"
        onPress={() => handlePageChange(page - 1)}
        disabled={!leaderboard.pagination.hasPrev}
      >
        <ChevronLeft className="text-muted-foreground" size={18} />
      </Button>
    );

    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    if (startPage > 1) {
      buttons.push(
        <Button
          size="icon"
          key={1}
          variant={page === 1 ? "default" : "outline"}
          onPress={() => handlePageChange(1)}
        >
          <Text>1</Text>
        </Button>
      );
      if (startPage > 2) {
        buttons.push(
          <Text key="dots1" className="px-2 text-muted-foreground">
            ...
          </Text>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          size="icon"
          key={i}
          variant={page === i ? "default" : "outline"}
          onPress={() => handlePageChange(i)}
        >
          <Text>{i}</Text>
        </Button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <Text key="dots2" className="px-2 text-muted-foreground">
            ...
          </Text>
        );
      }
      buttons.push(
        <Button
          size="icon"
          key={totalPages}
          variant={page === totalPages ? "default" : "outline"}
          onPress={() => handlePageChange(totalPages)}
        >
          <Text>{totalPages}</Text>
        </Button>
      );
    }

    // Next button
    buttons.push(
      <Button
        size="icon"
        key="next"
        variant="outline"
        onPress={() => handlePageChange(page + 1)}
        disabled={!leaderboard.pagination.hasNext}
      >
        <ChevronRight className="text-muted-foreground" size={18} />
      </Button>
    );

    return (
      <View className="flex flex-row items-center justify-center gap-2 flex-wrap">
        {buttons}
      </View>
    );
  };

  return (
    <ModalContainer>
      <View className="flex flex-1 flex-col pt-10">
        <View className="flex flex-col gap-2 px-4 pb-6">
          <Text className="font-bold text-4xl">Leaderboard</Text>
          <View className="flex flex-row items-center justify-between">
            <Text className="text-muted-foreground">
              Top{" "}
              {isPending
                ? "..."
                : Math.min(500, leaderboard?.pagination.total!)}{" "}
              players
            </Text>
            <Text className="text-muted-foreground">
              Page {isPending ? "..." : leaderboard?.pagination.page} of{" "}
              {isPending ? "..." : leaderboard?.pagination.totalPages}
            </Text>
          </View>
        </View>
        <View className="flex-1 px-4">
          {isPending ? (
            <ActivityIndicator className="text-muted-foreground p-4" />
          ) : leaderboard && leaderboard.users.length > 0 ? (
            <FlashList
              estimatedItemSize={60}
              showsVerticalScrollIndicator={false}
              data={leaderboard.users}
              renderItem={({ item, index }) => (
                <GridItemWrapper index={index} gap={20} numCols={1}>
                  <LeaderboardItem user={item} />
                </GridItemWrapper>
              )}
              keyExtractor={(item) => item.username}
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

        {leaderboard && leaderboard.pagination.totalPages > 1 && (
          <View
            className="border-t border-border px-4 pt-6"
            style={{ paddingBottom: insets.bottom }}
          >
            {renderPaginationButtons()}
          </View>
        )}
      </View>
    </ModalContainer>
  );
}
