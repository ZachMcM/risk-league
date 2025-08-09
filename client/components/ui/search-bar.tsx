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
    <View
      className={cn(
        "flex flex-row items-center border border-border rounded-lg px-4 min-h-11",
        className
      )}
    >
      <Search className="text-muted-foreground" size={16} />
      <Input
        className="flex-1 self-center bg-transparent border-0 h-11 py-0"
        {...props}
      />
    </View>
  );
}
