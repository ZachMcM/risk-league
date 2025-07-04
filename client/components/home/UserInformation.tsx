import { View } from "react-native";
import { Badge } from "../ui/badge";
import Pfp from "../ui/pfp";
import { Text } from "../ui/text";

export default function UserInformation({
  username,
  image,
  rank,
}: {
  username: string;
  image: string | null;
  rank: string;
}) {
  return (
    <View className="flex flex-col items-center gap-2">
      <Pfp username={username} image={image} className="h-20 w-20" />
      <Text className="font-bold text-3xl">{username}</Text>
      <Badge variant="secondary">
        <Text className="text-base">{rank}</Text>
      </Badge>
    </View>
  );
}
