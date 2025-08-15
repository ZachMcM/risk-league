import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { KeyboardAvoidingView } from "react-native";
import { cn } from "~/utils/cn";

function Container({
  children,
  className,
  style,
}: {
  children?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <KeyboardAvoidingView className="flex-1 flex" behavior="padding">
      <View style={style} className={cn("flex flex-1 py-24 px-4", className)}>
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}

export { Container };
