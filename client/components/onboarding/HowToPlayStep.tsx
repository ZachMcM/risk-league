import { Fragment } from "react";
import { View } from "react-native";
import { LogoIcon } from "../ui/logo-icon";
import { Text } from "../ui/text";
import { Dices } from "~/lib/icons/Dices";
import { Info } from "~/lib/icons/Info";
import { Button } from "../ui/button";
import { router } from "expo-router";

export default function HowToPlayStep({ close }: { close: () => void }) {
  return (
    <Fragment>
      <View className="flex flex-col items-center gap-2">
        <View className="flex flex-row items-center justify-center h-12 w-12 self-center rounded-full bg-primary/20">
          <Dices className="text-primary" size={20} />
        </View>
        <Text className="font-extrabold text-2xl text-center">How to Play</Text>
        <Text className="text-lg text-muted-foreground font-medium text-center">
          Learn the rules of Risk Leage and how it works
        </Text>
      </View>
      <Button
        size="lg"
        variant="outline"
        onPress={() => {
          close()
          router.navigate("/help")
        }}
        className="flex flex-row items-center gap-2"
      >
        <Info size={20} className="text-foreground"/>
        <Text className="font-bold">View The Full Guide</Text>
      </Button>
    </Fragment>
  );
}
