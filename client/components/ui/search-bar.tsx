import { TextInput, TextInputProps, View } from "react-native";
import { Search } from "~/lib/icons/Search";
import { Input } from "./input";
import { cn } from "~/utils/cn";

export function SearchBar({
  className,
  placeholderClassName,
  ...props
}: TextInputProps & {
  ref?: React.RefObject<TextInput>;
}) {
  return (
    <View className={cn("flex-1 flex-row items-center border border-border rounded-lg px-4")}>
      <Search className="text-muted-foreground" size={16} />
      <Input
        className="flex-1 bg-transparent border-0 h-10"
        {...props}
      />
    </View>
  );
}
