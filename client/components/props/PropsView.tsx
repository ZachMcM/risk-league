import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Search } from "~/lib/icons/Search";
import { cn } from "~/utils/cn";
import { Prop } from "~/types/prop";
import { Button } from "../ui/button";
import { SearchBar } from "../ui/search-bar";
import { Text } from "../ui/text";
import PropCard from "./PropCard";
import { League, propStats } from "~/lib/constants";
import { Flame } from "~/lib/icons/Flame";

export default function PropsView({
  props,
  league,
}: {
  props: Prop[];
  league: League;
}) {
  const [propFilter, setPropFilter] = useState<string>("popular");
  const [searchActivated, setSearchActivated] = useState(false);
  const [searchContent, setSearchContent] = useState<string | undefined>(
    undefined
  );

  const filteredProps = useMemo(
    () =>
      propFilter == "popular"
        ? props.sort((a, b) => b.picksCount - a.picksCount).slice(0, 14)
        : props.filter((prop) => prop.statName == propFilter),
    [props, propFilter]
  );

  const searchResults = useMemo(() => {
    if (!searchContent) return filteredProps;

    const searchLower = searchContent.toLocaleLowerCase().trim();
    return props.filter(
      (prop) =>
        prop.player.name?.toLocaleLowerCase().includes(searchLower) ||
        prop.player.team.fullName?.toLocaleLowerCase().includes(searchLower) ||
        prop.player.team.abbreviation
          ?.toLocaleLowerCase()
          .includes(searchLower) ||
        prop.player.position?.toLocaleLowerCase().includes(searchLower) ||
        prop.statDisplayName.toLocaleLowerCase().includes(searchLower)
    );
  }, [props, searchContent, filteredProps]);

  return (
    <View className="flex flex-1 flex-col gap-6">
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
            <Search className="text-white" size={16} />
            <Text className="font-semibold">Search</Text>
          </Pressable>
          <Pressable
            className={cn(
              "flex flex-row items-center gap-3 border-2 border-border py-2 px-4 rounded-xl",
              propFilter == "popular" && "border-primary bg-primary/20"
            )}
            onPress={() => setPropFilter("popular")}
          >
            <Flame className="text-orange-500" size={20} />
            <Text className="font-semibold">Popular</Text>
          </Pressable>
          {propStats
            .filter((stat) => stat.league == league)
            .map((stat) => (
              <Pressable
                key={stat.id}
                className={cn(
                  "flex flex-row items-center gap-3 border-2 border-border py-2 px-4 rounded-xl",
                  propFilter == stat.id && "border-primary bg-primary/20"
                )}
                onPress={() => setPropFilter(stat.id)}
              >
                <Text className="font-semibold">{stat.name}</Text>
              </Pressable>
            ))}
        </ScrollView>
      )}
      <View className="flex flex-1 flex-row items-center gap-4 flex-wrap">
        {(searchActivated ? searchResults : filteredProps).map((prop) => (
          <PropCard
            key={prop.id}
            prop={prop}
            popular={!searchActivated && propFilter == "popular"}
          />
        ))}
      </View>
    </View>
  );
}
