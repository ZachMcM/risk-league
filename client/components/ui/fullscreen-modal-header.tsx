import { Href, Link, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "~/lib/icons/X";

export default function FullScreenModalHeader({ close = false }: { close?: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ marginTop: insets.top }}
      className="flex flex-row items-center gap-2 p-4"
    >
      {close && (
        <Link href="../">
          <X size={24} className="text-muted-foreground" />
        </Link>
      )}
    </View>
  );
}
