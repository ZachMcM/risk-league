import { View } from "react-native";
import { Prop } from "~/types/props";
import { Card, CardContent } from "../ui/card";
import { Text } from "../ui/text";
import { Badge } from "../ui/badge";
import moment from "moment";
import { Button } from "../ui/button";

export default function PropsView({ props }: { props: Prop[] }) {
  console.log(props);

  return (
    <View className="flex flex-1 flex-row items-center gap-4 flex-wrap">
      {props.map((prop) => (
        <View key={prop.id} className="w-[48%]">
          <PropCard prop={prop} />
        </View>
      ))}
    </View>
  );
}

function PropCard({ prop }: { prop: Prop }) {
  return (
    <Card className="w-full">
      <CardContent className="p-6 flex flex-col items-center gap-4">
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
            vs {prop.oppTeam.abbreviation} •{" "}
            {moment(prop.gameStartTime).format("ddd h:mm A")}
          </Text>
        </View>
        <View className="flex flex-col items-center">
          <Text className="font-extrabold text-2xl">{prop.line}</Text>
          <Text className="text-muted-foreground">{prop.stat}</Text>
        </View>
        <View className="flex flex-row items-center justify-center gap-2">
          {prop.pickOptions?.map((option, i) => (
            <Button className="h-10 px-4" size="sm" variant="secondary" key={`${prop.id}_option_${i}`}>
              <Text className="capitalize font-semibold">{option}</Text>
            </Button>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}
