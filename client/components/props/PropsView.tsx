import { useState } from "react";
import { ScrollView, View } from "react-native";
import { League, propStats } from "~/lib/constants";
import { Search } from "~/lib/icons/Search";
import { Prop } from "~/types/prop";
import { cn } from "~/utils/cn";
import { Button } from "../ui/button";
import { SearchBar } from "../ui/search-bar";
import { Text } from "../ui/text";
import PropCard from "./PropCard";
import { FlashList } from "@shopify/flash-list";
import { GridItemWrapper } from "../ui/grid-item-wrapper";

export default function PropsView({
  props,
  league,
}: {
  props: Prop[];
  league: League;
}) {
  const [propFilter, setPropFilter] = useState<string>(
    propStats.filter((stat) => stat.league == league)[0].id
  );
  const [searchActivated, setSearchActivated] = useState(false);
  const [searchContent, setSearchContent] = useState<string>("");

  const filteredProps = (filter?: string) => {
    if (searchActivated) {
      const searchLower = searchContent.toLocaleLowerCase().trim();

      return props.filter(
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
      );
    }
    const selectedFilter = filter ?? propFilter;
    return props.filter((prop) => prop.statName == selectedFilter);
  };

  return (
    <View className="flex flex-col gap-4 flex-1">
      {searchActivated ? (
        <View className="flex flex-row items-center gap-3 w-full py-1 h-11">
          <SearchBar
            value={searchContent}
            onChangeText={setSearchContent}
            placeholder="Search"
            className="flex-1 h-11"
          />
          <Button
            size="sm"
            variant="secondary"
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
              .filter((stat) => stat.league == league)
              .map((stat) => (
                <Button
                  key={stat.id}
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "border-2 border-border/80 shadow-sm min-w-0",
                    propFilter == stat.id && "border-primary bg-primary/20"
                  )}
                  onPress={() => setPropFilter(stat.id)}
                >
                  <Text className="font-semibold">{stat.name}</Text>
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
            paddingBottom: 42
          }}
          data={filteredProps()}
          renderItem={({ item, index }) => (
            <GridItemWrapper
              index={index}
              numCols={2}
              gap={12}
            >
              <PropCard prop={item} />
            </GridItemWrapper>
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          estimatedItemSize={210}
        />
      )}
    </View>
  );
}
