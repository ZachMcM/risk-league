import { View } from "react-native";
import { LogoIcon } from "~/components/ui/logo-icon";

export default function Loading() {
  return (
    <View className="flex flex-1 w-full h-full flex-row justify-center items-center">
      <View className="relative mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
        <LogoIcon className="text-primary h-14 w-14" />
        <View className="absolute inset-0 border-2 border-primary/20 rounded-full animate-spin border-t-primary"></View>
      </View>
    </View>
  );
}
