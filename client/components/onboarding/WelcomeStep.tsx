import { Fragment } from "react";
import { View } from "react-native";
import { LogoIcon } from "../ui/logo-icon";
import { Text } from "../ui/text";

export default function WelcomeStep() {
  return (
    <Fragment>
      <View className="flex flex-col items-center gap-2">
        <View className="flex flex-row items-center justify-center h-12 w-12 self-center rounded-full bg-primary/20">
          <LogoIcon className="text-primary h-6 w-6" />
        </View>
        <Text className="font-extrabold text-2xl text-center">
          Welcome to Risk League!
        </Text>
        <Text className="text-lg text-muted-foreground font-medium text-center">
          We can help you set up your account and get situated!
        </Text>
      </View>
    </Fragment>
  );
}
