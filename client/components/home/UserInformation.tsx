import { View } from "react-native";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Text } from "../ui/text";

export default function UserInformation({
  username,
  image,
  rankString,
}: {
  username: string;
  image: string;
  rankString: string;
}) {
  return (
    <View className="rounded-2xl py-6 px-8 border border-primary/20 bg-primary/10">
      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-row items-center gap-4">
          <Avatar className="h-14 w-14 border border-primary/20" alt="Profile">
            {/* TODO */}
            <AvatarImage source={{ uri: "" }} />
            <AvatarFallback>
              <Text>RL</Text>
            </AvatarFallback>
          </Avatar>
          <Text className="text-foreground font-extrabold text-2xl">
            {username}
          </Text>
        </View>
        <Badge>
          <Text>{rankString}</Text>
        </Badge>
      </View>
    </View>
  );
}
