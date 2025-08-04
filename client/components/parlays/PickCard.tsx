import { Card, CardContent } from "../ui/card";
import { View } from "react-native";
import { Text } from "../ui/text";
import { ArrowDown } from "~/lib/icons/ArrowDown";
import { ArrowUp } from "~/lib/icons/ArrowUp";
import { Progress } from "../ui/progress";
import { X } from "~/lib/icons/X";
import { cn } from "~/lib/utils";
import { Check } from "~/lib/icons/Check";
import { Pick } from "~/types/parlay";

export default function PickCard({ pick }: { pick: Pick }) {
  return (
    <Card key={pick.id}>
      <CardContent className="p-4 flex flex-col gap-4">
        <View className="flex flex-row items-center gap-4">
          {/* Image Goes here */}
          <View className="flex flex-col gap-4 flex-1">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-col gap-1">
                <View className="flex flex-row items-center gap-2">
                  <Text className="font-semibold text-lg">
                    {pick.prop.player.name}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {pick.prop.player.position}
                  </Text>
                </View>
                <View className="flex flex-row items-center gap-1.5">
                  {pick.choice == "over" ? (
                    <ArrowUp size={18} className="text-foreground" />
                  ) : (
                    <ArrowDown size={18} className="text-foreground" />
                  )}
                  <Text className="font-bold text-lg">
                    {pick.prop.line} {pick.prop.statDisplayName}
                  </Text>
                </View>
              </View>
              <View
                className={cn(
                  "h-6 w-6 border-2 border-border rounded-full flex justify-center items-center",
                  pick.status != "not_resolved" &&
                    (pick.status == "hit"
                      ? "bg-success border-success"
                      : "bg-destructive border-destructive")
                )}
              >
                {pick.status != "not_resolved" &&
                  (pick.status == "hit" ? (
                    <Check
                      strokeWidth={3}
                      size={16}
                      className="text-foreground"
                    />
                  ) : (
                    <X strokeWidth={3} size={16} className="text-foreground" />
                  ))}
              </View>
            </View>
            <Progress
              value={pick.prop.currentValue}
              max={pick.prop.line}
              showValueText
              className="h-3 w-full"
              variant={
                pick.status == "hit"
                  ? "success"
                  : pick.status == "missed"
                  ? "destructive"
                  : "default"
              }
            />
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
