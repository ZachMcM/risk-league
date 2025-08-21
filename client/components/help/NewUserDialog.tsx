import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ReactNode, useRef, useState } from "react";
import { View } from "react-native";
import { io } from "socket.io-client";
import { toast } from "sonner-native";
import { authClient } from "~/lib/auth-client";
import { Info } from "~/lib/icons/Info";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { LogoIcon } from "../ui/logo-icon";
import { Progress } from "../ui/progress";
import { Text } from "../ui/text";
import { League } from "~/lib/config";

export default function NewUserDialog({
  isOpen,
  onOpenChange,
  close,
}: {
  isOpen: boolean;
  onOpenChange: (val: boolean) => void;
  close: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <View className="flex flex-col items-center gap-6 py-4">
          <LogoIcon className="text-primary h-12 w-12" />
          <View className="flex flex-col items-center gap-2">
            <Text className="font-extrabold text-2xl text-center">
              Welcome to Risk League!
            </Text>
            <Text className="text-lg text-muted-foreground font-medium text-center">
              New to Risk League or sports betting? We can show you how matches
              work and help you get started.
            </Text>
          </View>
          <View className="flex flex-col gap-4 w-full">
            <Button
              onPress={() => {
                close()
                router.navigate("/help")
              }}
              size="lg"
              variant="default"
              className="flex flex-row gap-3 items-center"
            >
              <Info size={20} className="text-foreground" />
              <Text className="font-bold">Show Me How It Works</Text>
            </Button>
            <Button onPress={close} size="lg" variant="outline">
              <Text className="font-bold">Skip, I'm Ready to Play</Text>
            </Button>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  );
}
