import { Image, ImageSource } from "expo-image";
import { View } from "react-native";
import { Play } from "~/lib/icons/Play";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Text } from "../ui/text";
import MatchmakingDialog from "./MatchmakingDialog";

export default function StartMatchCard({
  image,
  league,
}: {
  image: ImageSource;
  league: string;
}) {
  return (
    <Card className="w-[48%] self-stretch">
      <CardContent className="p-0 flex-1 flex flex-col">
        <View className="relative overflow-hidden h-32">
          <Image
            contentFit="cover"
            source={image}
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <View className="flex flex-col justify-between gap-3 p-4 flex-1">
          <Text className="font-extrabold text-2xl uppercase">{league}</Text>
          <MatchmakingDialog league={league}>
            <Button className="flex flex-row items-center gap-2">
              <Play className="text-foreground" size={18} />
              <Text className="font-bold">Start Match</Text>
            </Button>
          </MatchmakingDialog>
        </View>
      </CardContent>
    </Card>
  );
}
