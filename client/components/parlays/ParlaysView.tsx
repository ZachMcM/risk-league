import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Search } from "~/lib/icons/Search";
import { Parlay } from "~/types/parlay";
import { cn } from "~/utils/cn";
import { Button } from "../ui/button";
import { SearchBar } from "../ui/search-bar";
import { Text } from "../ui/text";
import ParlayCard from "./ParlayCard";

const parlayFiltersList = [
  "all",
  "active",
  "completed",
  "won",
  "lost",
] as const;

export default function ParlaysView({ parlays }: { parlays: Parlay[] }) {
  const [searchActivated, setSearchActivated] = useState(false);
  const [searchContent, setSearchContent] = useState("");
  const [parlayFilter, setParlayFilter] =
    useState<(typeof parlayFiltersList)[number]>("all");

  const filteredParlays = (filter?: (typeof parlayFiltersList)[number]) => {
    if (searchActivated) {
      const searchLower = searchContent.toLocaleLowerCase().trim();

      return parlays.filter(
        (parlay) =>
          parlay.type.toLocaleLowerCase().includes(searchLower) ||
          parlay.picks.some((pick) => {
            return (
              pick.prop.player.name
                ?.toLocaleLowerCase()
                .includes(searchLower) ||
              pick.prop.player.team.fullName
                ?.toLocaleLowerCase()
                .includes(searchLower) ||
              pick.prop.player.team.nickname
                ?.toLocaleLowerCase()
                .includes(searchLower)
            );
          })
      );
    }
    const selectedFilter = filter ?? parlayFilter;
    return parlays.filter((parlay) =>
      selectedFilter == "all"
        ? true
        : selectedFilter == "active"
        ? !parlay.resolved
        : selectedFilter == "completed"
        ? parlay.resolved
        : selectedFilter == "lost"
        ? parlay.profit < 0
        : parlay.profit > 0
    );
  };

  return (
    <View className="flex flex-col gap-4">
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
            {parlayFiltersList.map((filter) => (
              <Button
                key={filter}
                variant="secondary"
                size="sm"
                className={cn(
                  "border-2 border-border/80 shadow-sm min-w-0",
                  parlayFilter == filter && "border-primary bg-primary/20"
                )}
                onPress={() => setParlayFilter(filter)}
              >
                <Text className="font-semibold capitalize">
                  {filter} ({filteredParlays(filter).length})
                </Text>
              </Button>
            ))}
          </ScrollView>
        </View>
      )}
      {filteredParlays().length == 0 ? (
        <View className="flex flex-col gap-4 p-4 items-center">
          <View className="flex flex-col gap-4 items-center">
            <View className="flex flex-col gap-1 items-center">
              <Text className="font-bold text-2xl text-center">
                No parlay results
              </Text>
              <Text className="font-semibold text-muted-foreground text-center max-w-sm">
                Try a different filter
              </Text>
            </View>
          </View>
        </View>
      ) : (
        filteredParlays().map((parlay) => (
          <ParlayCard key={parlay.id} parlay={parlay} />
        ))
      )}
    </View>
  );
}
