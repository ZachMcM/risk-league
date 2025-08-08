import { ReactNode } from "react";
import { View } from "react-native";
import { KeyboardAvoidingView } from "react-native";
import { cn } from "~/utils/cn";

function Container({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <KeyboardAvoidingView className="flex-1 flex" behavior="padding">
      <View className={cn("flex flex-1 py-24 px-4", className)}>
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}

export { Container };
