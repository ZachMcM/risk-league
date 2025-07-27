import { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { cn } from "~/lib/utils";

export function ScrollContainer({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <KeyboardAvoidingView className="flex-1 flex" behavior="padding">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        <View className={cn("flex flex-1 px-4 pt-2 pb-10", className)}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}