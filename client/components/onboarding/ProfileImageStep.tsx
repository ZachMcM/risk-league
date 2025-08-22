import { Fragment } from "react";
import { View } from "react-native";
import { Camera } from "~/lib/icons/Camera";
import { Upload } from "~/lib/icons/Upload";
import { Text } from "../ui/text";
import ProfileImage from "../ui/profile-image";
import { authClient } from "~/lib/auth-client";
import { Button } from "../ui/button";

export default function ProfileImageStep() {
  const { data } = authClient.useSession();

  async function handleImageUpload() {
    
  }

  return (
    <Fragment>
      <View className="flex flex-col items-center gap-2">
        <View className="flex flex-row items-center justify-center h-12 w-12 self-center rounded-full bg-primary/20">
          <Camera className="text-primary" size={20} />
        </View>
        <Text className="font-extrabold text-2xl text-center">
          Add a Profile Picture
        </Text>
        <Text className="text-lg text-muted-foreground font-medium text-center">
          Upload a photo so your friends can recognize you
        </Text>
      </View>
      <View className="flex flex-col gap-4 items-center w-full">
        <ProfileImage
          username={data?.user.username!}
          image={data?.user.image!}
          className="h-24 w-24"
        />
      </View>
      <Button size="lg" className="flex flex-row items-center gap-2" variant="outline">
        <Upload className="text-foreground"/>
        <Text className="font-bold">Upload Photo</Text>
      </Button>
    </Fragment>
  );
}
