import { FlashList } from "@shopify/flash-list";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { League, propStats } from "~/lib/config";
import { Search } from "~/lib/icons/Search";
import { Game, Prop } from "~/types/prop";
import { cn } from "~/utils/cn";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { GridItemWrapper } from "../ui/grid-item-wrapper";
import { SearchBar } from "../ui/search-bar";
import { Text } from "../ui/text";
import PropCard from "./PropCard";
import { Image } from "expo-image";

export function GameCard({
  game,
  isSelected,
}: {
  game: Game;
  isSelected: boolean;
}) {
  return (
    <Card className={cn(isSelected && "border-primary")}>
      <CardContent className="p-3 flex flex-col gap-2">
        <Text className="text-xs text-muted-foreground text-center">
          Today, {moment(game.startTime).format("h:mm A")}
        </Text>
        <View className="flex flex-col gap-2">
          <View className="flex flex-row items-center gap-2">
            {game.awayTeam.image && (
              <Image
                source={{ uri: game.awayTeam.image }}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
              />
            )}
            <Text className="font-bold text-sm">
              {game.awayTeam.abbreviation}
            </Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            {game.homeTeam.image && (
              <Image
                source={{ uri: game.homeTeam.image }}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
              />
            )}
            <Text className="font-bold text-sm">
              {game.homeTeam.abbreviation}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

export default function PropsView({
  props,
  league,
}: {
  props: Prop[];
  league: League;
}) {
  const [propFilter, setPropFilter] = useState<string>(
    propStats.filter((stat) => stat.leagues.includes(league))[0].displayName
  );
  const [gameId, setGameId] = useState<string | null>(null);
  const [searchActivated, setSearchActivated] = useState(false);
  const [searchContent, setSearchContent] = useState<string>("");

  const filteredProps = (filter?: string) => {
    const filtered: Prop[] = [];
    if (searchActivated) {
      const searchLower = searchContent.toLocaleLowerCase().trim();

      filtered.push(
        ...props.filter(
          (prop) =>
            prop.player.name?.toLocaleLowerCase().includes(searchLower) ||
            prop.player.team.fullName
              ?.toLocaleLowerCase()
              .includes(searchLower) ||
            prop.player.team.abbreviation
              ?.toLocaleLowerCase()
              .includes(searchLower) ||
            prop.player.position?.toLocaleLowerCase().includes(searchLower) ||
            prop.statDisplayName?.toLocaleLowerCase().includes(searchLower)
        )
      );
    }
    const selectedFilter = filter ?? propFilter;
    filtered.push(
      ...props.filter((prop) => prop.statDisplayName == selectedFilter)
    );
    if (gameId) {
      return filtered.filter((el) => el.game.gameId == gameId);
    } else {
      return filtered;
    }
  };

  const searchBarRef = useRef<TextInput>(null);

  useEffect(() => {
    if (searchActivated) {
      searchBarRef.current?.focus();
    }
  }, [searchActivated]);

  const uniqueGames = [...new Set(props?.map((prop) => prop.game.gameId))]
    .map((gameId) =>
      props.map((prop) => prop.game).find((game) => game.gameId == gameId)
    )
    .filter((game) => game !== undefined);

  return (
    <View className="flex flex-col gap-4 flex-1">
      {/* {uniqueGames.length !== 0 && (
        <View className="w-full">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ display: "flex", gap: 12 }}
          >
            {uniqueGames.map((game) => (
              <Pressable
                key={game.gameId}
                onPress={() => {
                  if (gameId == game.gameId) {
                    setGameId(null);
                  } else {
                    setGameId(game.gameId);
                  }
                }}
              >
                <GameCard isSelected={gameId == game.gameId} game={game} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )} */}
      {searchActivated ? (
        <View className="flex flex-row items-center gap-3 w-full py-1 h-11">
          <SearchBar
            ref={searchBarRef}
            value={searchContent}
            onChangeText={setSearchContent}
            placeholder="Search"
            className="flex-1 h-11"
          />
          <Button
            size="sm"
            variant="foreground"
            onPress={() => {
              setSearchActivated(false);
              setSearchContent("");
            }}
          >
            <Text>Cancel</Text>
          </Button>
        </View>
      ) : (
        <View className="h-11">
          <ScrollView
            contentContainerClassName="flex flex-row items-center gap-2 py-1 h-11"
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <Button
              className="flex flex-row items-center justify-center gap-2"
              variant="outline"
              size="sm"
              onPress={() => {
                setSearchActivated(true);
              }}
            >
              <Search className="text-foreground" size={16} />
              <Text className="font-semibold">Search</Text>
            </Button>
            {propStats
              .filter((stat) => stat.leagues.includes(league))
              .map((stat) => (
                <Button
                  key={stat.displayName}
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "border-2 border-border shadow-sm min-w-0",
                    propFilter == stat.displayName &&
                      "border-primary bg-primary/20"
                  )}
                  onPress={() => setPropFilter(stat.displayName)}
                >
                  <Text className="font-semibold">{stat.displayName}</Text>
                </Button>
              ))}
          </ScrollView>
        </View>
      )}
      {filteredProps().length == 0 ? (
        <View className="flex flex-col gap-4 p-4 items-center">
          <View className="flex flex-col gap-4 items-center">
            <View className="flex flex-col gap-1 items-center">
              <Text className="font-bold text-2xl text-center">
                No prop results
              </Text>
              <Text className="font-semibold text-muted-foreground text-center max-w-sm">
                Try a different filter
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <FlashList
          contentContainerStyle={{
            paddingBottom: 42,
          }}
          showsVerticalScrollIndicator={false}
          data={filteredProps()}
          renderItem={({ item, index }) => (
            <GridItemWrapper index={index} numCols={1} gap={12}>
              <PropCard prop={item} />
            </GridItemWrapper>
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={1}
          estimatedItemSize={210}
        />
      )}
    </View>
  );
}
