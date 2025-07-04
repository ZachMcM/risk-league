import { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { cn } from "~/lib/utils";

function ScrollContainer({
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
          flex: 1,
          display: "flex",
        }}
      >
        <View className={cn("flex flex-1 p-6", className)}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export { ScrollContainer };
