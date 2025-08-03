import { View } from "react-native";
import { cn } from "~/lib/utils";
import { Progress } from "../ui/progress";
import { Text } from "../ui/text";
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { Pick } from "~/types/parlay";

export default function PickCard({ pick }: { pick: Pick }) {
  return (
    <View
      key={pick.id}
      className="bg-secondary flex gap-4 flex-col p-4 rounded-lg"
    >
      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-row items-center gap-4">
          <View
            className={cn(
              "h-2 w-2 rounded-full",
              pick.status == "not_resolved"
                ? "bg-blue-500 animate-pulse"
                : pick.status == "hit"
                ? "bg-success"
                : "bg-destructive"
            )}
          />
          <View className="flex flex-col">
            <Text className="font-bold text-lg">{pick.prop.player.name}</Text>
          </View>
        </View>
        <View className="flex flex-col">
          <View className="flex flex-row items-center self-end gap-1">
            {pick.choice == "over" ? (
              <ArrowUp className="text-muted-foreground" size={20} />
            ) : (
              <ArrowDown className="text-muted-foreground" size={20} />
            )}
            <Text className="text-muted-foreground font-semibold">
              {pick.prop.line}
            </Text>
          </View>
          <Text className="text-muted-foreground font-semibold">
            {pick.prop.statDisplayName}
          </Text>
        </View>
      </View>
      <Progress
        showValueText
        className="bg-primary/10 h-3"
        indicatorClassName="bg-primary rounded-lg"
        value={pick.prop.currentValue}
        max={pick.prop.line}
      />
    </View>
  );
}
