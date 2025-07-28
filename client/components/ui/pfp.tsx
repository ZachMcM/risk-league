import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Text } from "./text";

export default function Pfp({
  image,
  username,
  className,
}: {
  image: string | null;
  username: string;
  className?: string;
}) {
  return (
    <Avatar
      className={cn(
        "h-14 w-14 rounded-full shadow-lg",
        className
      )}
      alt="Profile"
    >
      <AvatarImage
        source={{
          uri: image!,
        }}
      />
      <AvatarFallback>
        <Text className="font-bold text-sm">
          {username.slice(0, 2).toUpperCase()}
        </Text>
      </AvatarFallback>
    </Avatar>
  );
}
