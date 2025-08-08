import { Fragment, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Search } from "~/lib/icons/Search";
import { Parlay } from "~/types/parlay";
import { Button } from "../ui/button";
import { SearchBar } from "../ui/search-bar";
import { Text } from "../ui/text";
import ParlaysCard from "./ParlayCard";
import { cn } from "~/utils/cn";

const parlayFiltersList = [
  "all",
  "active",
  "completed",
  "won",
  "lost",
] as const;

export default function ParlaysView({
  parlays,
  resolved,
}: {
  parlays: Parlay[];
  resolved: boolean;
}) {
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
    <View className="flex flex-1 flex-col gap-6 w-full">
      {parlays.length == 0 ? (
        <View className="flex flex-col gap-4 p-4 items-center">
          <View className="flex flex-col gap-1 items-center">
            <Text className="font-bold text-2xl text-center">No Parlays</Text>
            <Text className="font-semibold text-muted-foreground text-center">
              {resolved
                ? "Next time place a parlay to avoid diqualification!"
                : "Go place some picks!"}
            </Text>
          </View>
        </View>
      ) : (
        <Fragment>
          {searchActivated ? (
            <View className="flex flex-1 flex-row items-center gap-3">
              <SearchBar
                value={searchContent}
                onChangeText={setSearchContent}
                placeholder="Search"
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
            <ScrollView
              contentContainerStyle={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <Pressable
                className="flex flex-row items-center gap-2 border-2 border-border py-2 px-4 rounded-xl"
                onPress={() => {
                  setSearchActivated(true);
                }}
              >
                <Search className="text-foreground" size={16} />
                <Text className="font-semibold">Search</Text>
              </Pressable>
              {parlayFiltersList.map((filter) => (
                <Pressable
                  key={filter}
                  className={cn(
                    "flex flex-row items-center gap-3 border-2 border-border py-2 px-4 rounded-xl",
                    parlayFilter == filter && "border-primary bg-primary/20"
                  )}
                  onPress={() => setParlayFilter(filter)}
                >
                  <Text className="font-semibold capitalize">
                    {filter} ({filteredParlays(filter).length})
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          {filteredParlays().map((parlay) => (
            <ParlaysCard key={parlay.id} parlay={parlay} />
          ))}
        </Fragment>
      )}
    </View>
  );
}
