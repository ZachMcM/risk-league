import { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "~/lib/utils";

export function ScrollContainer({
  children,
  className,
  safeAreaInsets = false,
}: {
  children?: ReactNode;
  className?: string;
  safeAreaInsets?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView className="flex-1 flex" behavior="padding">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          marginTop: safeAreaInsets ? insets.top : 0,
          marginBottom: insets.bottom,
        }}
      >
        <View className={cn("flex flex-1 px-4 pt-2 pb-10", className)}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
