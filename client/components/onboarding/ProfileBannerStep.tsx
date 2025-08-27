import { Fragment } from "react";
import { Pressable, View } from "react-native";
import { Image } from "~/lib/icons/Image";
import { Text } from "../ui/text";

export default function ProfileBannerStep() {
  return (
    <Fragment>
      <View className="flex flex-col items-center gap-2">
        <View className="flex flex-row items-center justify-center h-12 w-12 self-center rounded-full bg-primary/20">
          <Image className="text-primary" size={20} />
        </View>
        <Text className="font-extrabold text-2xl text-center">
          Add Header Image
        </Text>
        <Text className="text-lg text-muted-foreground font-medium text-center">
          Personalize your profile with a header image
        </Text>
      </View>
      <Pressable className="w-full h-48 bg-secondary border border-muted-foreground/20 border-dashed flex flex-col gap-2 items-center justify-center rounded-lg">
        <Image className="text-muted-foreground" size={28} />
        <Text className="text-muted-foreground">
          Personalize your profile with a header image
        </Text>
      </Pressable>
    </Fragment>
  );
}
