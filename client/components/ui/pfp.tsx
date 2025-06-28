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
        "h-14 w-14 border-2 rounded-full border-primary/30 shadow-lg",
        className
      )}
      alt="Profile"
    >
      <AvatarImage
        source={{
          uri: image!,
        }}
      />
      <AvatarFallback className="bg-primary/20">
        <Text className="text-primary font-geist-bold text-lg">
          {username.slice(0, 2).toUpperCase()}
        </Text>
      </AvatarFallback>
    </Avatar>
  );
}
