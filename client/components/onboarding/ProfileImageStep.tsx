import { Fragment, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Camera } from "~/lib/icons/Camera";
import { Upload } from "~/lib/icons/Upload";
import { Text } from "../ui/text";
import ProfileImage from "../ui/profile-image";
import { authClient } from "~/lib/auth-client";
import { Button } from "../ui/button";
import * as ImagePicker from "expo-image-picker";
import { patchUserImage } from "~/endpoints";
import { toast } from "sonner-native";

export default function ProfileImageStep() {
  const { data, refetch } = authClient.useSession();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function pickImage() {
    setIsPickerLoading(true);
    let res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!res.canceled) {
      setSelectedImage(res.assets[0].uri);
      setSelectedAsset(res.assets[0]);
    }
    setIsPickerLoading(false);
  }

  async function handleImageUpload() {
    if (!selectedAsset || !data?.user.id) return;

    setIsUploading(true);
    try {
      // Upload image using the asset URI directly
      await patchUserImage(data.user.id, selectedAsset);

      // Refetch auth session to get updated user data
      refetch();

      // Reset selected image since it's now uploaded
      setSelectedImage(null);
      setSelectedAsset(null);
    } catch (error) {
      toast.error("Image upload failed!")
      console.log(error)
    } finally {
      setIsUploading(false);
    }
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
          image={selectedImage ?? data?.user.image!}
          className="h-24 w-24"
        />
      </View>
      {selectedImage ? (
        <Button
          size="lg"
          variant="secondary"
          className="flex flex-row items-center gap-2"
          onPress={handleImageUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator className="text-foreground" />
          ) : (
            <Upload className="text-foreground" />
          )}
          <Text className="font-bold">Save Image</Text>
        </Button>
      ) : (
        <Button
          size="lg"
          className="flex flex-row items-center gap-2"
          variant="outline"
          onPress={pickImage}
          disabled={isPickerLoading}
        >
          {isPickerLoading ? (
            <ActivityIndicator className="text-foreground" />
          ) : (
            <Upload className="text-foreground" />
          )}
          <Text className="font-bold">Choose Image</Text>
        </Button>
      )}
    </Fragment>
  );
}
