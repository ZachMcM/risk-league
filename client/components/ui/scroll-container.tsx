import { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";

function ScrollContainer({ children }: { children?: ReactNode }) {
  return (
    <KeyboardAvoidingView className="flex-1 flex" behavior="padding">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flex: 1,
          display: "flex",
        }}
      >
        <View className="flex flex-1 py-24 px-4">{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export { ScrollContainer };
