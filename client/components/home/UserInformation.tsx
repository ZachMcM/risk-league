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
  image: string | null;
  rankString: string;
}) {
  return (
    <View className="rounded-2xl p-4 border border-primary/20 bg-primary/10">
      <View className="flex flex-row items-center gap-4">
        <Avatar className="h-14 w-14 border border-primary/20" alt="Profile">
          <AvatarImage
            source={{
              uri: image || process.env.EXPO_PUBLIC_FALLBACK_IMAGE,
            }}
          />
          <AvatarFallback>
            <Text>RL</Text>
          </AvatarFallback>
        </Avatar>
        <View className="flex flex-col gap-1 items-start">
          <Badge>
            <Text>{rankString}</Text>
          </Badge>
          <Text className="text-foreground font-bold text-xl">{username}</Text>
        </View>
      </View>
    </View>
  );
}
