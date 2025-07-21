import moment from "moment";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Search } from "~/lib/icons/Search";
import { cn, formatCompactNumber, getStatName } from "~/lib/utils";
import { Prop, propStats } from "~/types/props";
import { useParlayPicks } from "../providers/ParlayProvider";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { SearchBar } from "../ui/search-bar";
import { Text } from "../ui/text";

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

    const searchLower = searchContent.toLowerCase();
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
            className="h-11"
          />
          <Button
            variant="foreground"
            size="sm"
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

function PropCard({ prop, popular }: { prop: Prop; popular?: boolean }) {
  const { isPropPicked, addPick, removePick, updatePick, getPick } =
    useParlayPicks();

  return (
    <Card className={cn("w-[48%]", isPropPicked(prop.id) && "border-primary")}>
      <CardContent className="p-4 flex flex-col items-center gap-4">
        {popular && (
          <Text className="self-end text-xs font-semibold text-muted-foreground">
            🔥 {formatCompactNumber(prop.parlayPicksCount)}
          </Text>
        )}
        <View className="flex flex-col items-center gap-1">
          <View className="flex flex-row items-center gap-2">
            <Badge variant="secondary">
              <Text>{prop.player.team.abbreviation}</Text>
            </Badge>
            <Text className="font-semibold text-muted-foreground text-xs">
              {prop.player.position}
            </Text>
          </View>
          <Text className="font-bold text-lg">{prop.player.name}</Text>
          <Text className="font-semibold text-muted-foreground text-sm">
            {/* TODO */}
            vs ABRV •{" "}
            {moment(prop.gameStartTime).format("ddd h:mm A")}
          </Text>
        </View>
        <View className="flex flex-col items-center">
          <Text className="font-extrabold text-2xl">{prop.line}</Text>
          <Text className="text-muted-foreground">
            {getStatName(prop.stat)}
          </Text>
        </View>
        <View className="flex flex-row items-center justify-center gap-1">
          {prop.pickOptions?.map((option, i) => (
            <Button
              onPress={() => {
                if (isPropPicked(prop.id)) {
                  if (getPick(prop.id) == option) {
                    removePick(prop.id);
                  } else {
                    console.log("update pick");
                    updatePick(prop.id, option);
                  }
                } else {
                  addPick({ prop, pick: option });
                }
              }}
              className={cn(
                "h-10 flex-grow flex-1 flex-row justify-center items-center bg-background border border-border",
                getPick(prop.id) == option &&
                  "border-primary bg-primary/20"
              )}
              size="sm"
              key={`${prop.id}_option_${i}`}
            >
              <Text className="capitalize font-semibold">{option}</Text>
            </Button>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}
