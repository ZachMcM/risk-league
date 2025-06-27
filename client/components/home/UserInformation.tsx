import { View } from "react-native";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Text } from "../ui/text";
import Pfp from "../ui/pfp";
import { Card, CardContent } from "../ui/card";

export default function UserInformation({
  username,
  image,
  rankString,
}: {
  username: string;
  image: string | null;
  rankString: string;
}) {
  return (
    <Card className="border-primary/20 bg-primary/10">
      <CardContent className="p-4">
        <View className="flex flex-row items-center gap-4">
          <Pfp username={username} image={image} />
          <View className="flex flex-col gap-1 items-start">
            <Badge>
              <Text>{rankString}</Text>
            </Badge>
            <Text className="text-foreground font-bold text-xl">
              {username}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
