import { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "~/utils/cn";

export function ScrollContainer({
  children,
  className,
  safeAreaInsets = false,
  ref
}: {
  children?: ReactNode;
  className?: string;
  safeAreaInsets?: boolean;
  ref?: React.RefObject<ScrollView | null>
}) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView className="flex-1 flex" behavior="padding">
      <ScrollView
        ref={ref}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow"
        contentContainerStyle={{
          marginTop: safeAreaInsets ? insets.top : 0,
          marginBottom: safeAreaInsets ? insets.bottom : 0,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className={cn("flex flex-1 p-6 pb-20", className)}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
