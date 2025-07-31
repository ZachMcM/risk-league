import { Pressable, View } from "react-native";
import { Text } from "../ui/text";
import { useState } from "react";
import { Zap } from "~/lib/icons/Zap";
import { Trophy } from "~/lib/icons/Trophy";
import { cn } from "~/lib/utils";
import { Card, CardContent } from "../ui/card";
import { DropdownMenu, DropdownMenuTrigger } from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../ui/button";

export default function StartMatch() {
  const [matchType, setMatchType] = useState<null | "competitive" | "quick">(
    null
  );
  const [matchLeague, setMatchLeague] = useState<null | "nba" | "mlb">(null);

  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-4">
        <View className="flex flex-col">
          <Text className="font-bold text-lg">Start Match</Text>
        </View>
        <View className="flex flex-row gap-4">
          <Pressable
            onPress={() => setMatchType("competitive")}
            className={cn(
              "border border-border rounded-2xl flex flex-col gap-1 p-4 items-center flex-1",
              matchType == "competitive" && "border-primary"
            )}
          >
            <View className="bg-red-500/10 p-3 rounded-lg">
              <Trophy className="text-red-500" size={20} />
            </View>
            <View className="flex flex-col items-center">
              <Text className="font-bold text-lg">Competitive</Text>
              <Text className="text-muted-foreground">Ranked</Text>
            </View>
            {matchType == "competitive" && (
              <View className="rounded-full border-4 border-primary p-1 bg-foreground absolute -top-1 -right-1" />
            )}
          </Pressable>
          <Pressable
            onPress={() => setMatchType("quick")}
            className={cn(
              "border border-border rounded-2xl flex flex-col gap-1 p-4 items-center flex-1 relative",
              matchType == "quick" && "border-primary"
            )}
          >
            <View className="bg-green-500/10 p-3 rounded-lg">
              <Zap className="text-green-500" size={20} />
            </View>
            <View className="flex flex-col items-center">
              <Text className="font-bold text-lg">Quick Match</Text>
              <Text className="text-muted-foreground">For Fun</Text>
            </View>
            {matchType == "quick" && (
              <View className="rounded-full border-4 border-primary p-1 bg-foreground absolute -top-1 -right-1" />
            )}
          </Pressable>
        </View>
        <Button size="lg">
          <Text className="font-bold">Start Match</Text>
        </Button>
      </CardContent>
    </Card>
  );
}
