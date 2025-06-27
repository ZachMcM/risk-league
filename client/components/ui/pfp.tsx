import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Text } from "./text";

export default function Pfp({
  image,
  username,
}: {
  image: string | null;
  username: string;
}) {
  return (
    <Avatar
      className="h-14 w-14 border-2 rounded-full border-primary/30 shadow-lg"
      alt="Profile"
    >
      <AvatarImage
        source={{
          uri: image!,
        }}
      />
      <AvatarFallback className="bg-primary/20">
        <Text className="text-primary font-bold text-lg">
          {username.slice(0, 2).toUpperCase()}
        </Text>
      </AvatarFallback>
    </Avatar>
  );
}
