import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Search } from "~/lib/icons/Search";
import { cn, getStatName } from "~/lib/utils";
import { Prop, propStats } from "~/types/props";
import { Button } from "../ui/button";
import { SearchBar } from "../ui/search-bar";
import { Text } from "../ui/text";
import PropCard from "./PropCard";

export default function PropsView({ props }: { props: Prop[] }) {
  const [propFilter, setPropFilter] = useState<string>("popular");
  const [searchActivated, setSearchActivated] = useState(false);
  const [searchContent, setSearchContent] = useState<string | undefined>(
    undefined
  );

  const filteredProps = useMemo(
    () =>
      propFilter == "popular"
        ? props
            .sort((a, b) => a.parlayPicksCount - b.parlayPicksCount)
            .slice(0, 14)
        : props.filter((prop) => prop.stat == propFilter),
    [props, propFilter]
  );

  const searchResults = useMemo(() => {
    if (!searchContent) return filteredProps;

    const searchLower = searchContent.toLowerCase().trim();
    return props.filter(
      (prop) =>
        prop.player.name?.toLowerCase().includes(searchLower) ||
        prop.player.team.fullName?.toLowerCase().includes(searchLower) ||
        prop.player.team.abbreviation?.toLowerCase().includes(searchLower) ||
        getStatName(prop.stat).toLowerCase().includes(searchLower)
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
            onPress={() => setSearchActivated(true)}
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
            <Text className="font-semibold">🔥 Popular</Text>
          </Pressable>
          {propStats.map((stat) => (
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
