import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ReactNode, useRef, useState } from "react";
import { View } from "react-native";
import { io } from "socket.io-client";
import { toast } from "sonner-native";
import { authClient } from "~/lib/auth-client";
import { X } from "~/lib/icons/X";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { LogoIcon } from "../ui/logo-icon";
import { Progress } from "../ui/progress";
import { Text } from "../ui/text";
import { League } from "~/lib/config";

const messages = [
  "Matching skill levels...",
  "Searching for opponent...",
  "Analyzing ranks...",
  "Finding the perfect match...",
  "Hang tight, almost there...",
];

interface MatchmakingDialogProps {
  children: React.ReactNode;
  league: League;
}

export default function MatchmakingDialog({
  children,
  league,
  disableTrigger = false,
}: {
  children: ReactNode;
  league: League;
  disableTrigger?: boolean;
}) {
  const queryClient = useQueryClient();
  const { data } = authClient.useSession();
  const userId = data?.user.id!;

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(messages[0]);

  const startMatchmaking = () => {
    setProgress(0);
    setLoadingMessage(messages[0]);

    let index = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const randomIncrement = Math.floor(Math.random() * 6) + 5;
        const newProgress = prev + randomIncrement;
        return Math.min(newProgress, 95);
      });

      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 2000);

    const socket = io(`${process.env.EXPO_PUBLIC_API_URL}/matchmaking`, {
      auth: { userId: userId.toString(), league },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () =>
      console.log("Connected to matchmaking namespace")
    );

    socket.on("match-found", ({ matchId }: { matchId: string }) => {
      console.log(`Found match id: ${matchId}`);
      clearInterval(interval);
      setProgress(100);
      setLoadingMessage("Opponent found!");
      toast.success("Opponent found!");
      queryClient.invalidateQueries({
        queryKey: ["matches", data?.user.id, "unresolved"],
      });
      socket.disconnect();
      setIsOpen(false);
      router.navigate({
        pathname: "/match/[matchId]",
        params: { matchId },
      });
    });

    socket.on("matchmaking-failed", () => {
      console.log("Failed to create match");
      clearInterval(interval);
      setProgress(0);
      setLoadingMessage("Matchmaking failed...");
      toast.error("Matchmaking failed");
      socket.disconnect();
      setIsOpen(false);
    });
  };

  const cancelMatchmaking = () => {
    socketRef.current?.emit("cancel-search");
    socketRef.current?.disconnect();
    setIsOpen(false);
    setProgress(0);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      startMatchmaking();
    } else {
      cancelMatchmaking();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger disabled={disableTrigger} asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <View className="flex flex-col items-center gap-4 py-4">
          <View className="relative mx-auto w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
            <LogoIcon className="text-primary h-8 w-8" />
            <View className="absolute inset-0 border-2 border-primary/20 rounded-full animate-spin border-t-primary" />
          </View>
          <View className="flex flex-col items-center gap-2">
            <Text className="font-extrabold text-2xl text-center">
              Finding {league.toUpperCase()} Match Opponent
            </Text>
            <Text className="text-lg text-muted-foreground font-medium text-center">
              We're matching you with the perfect competitor
            </Text>
          </View>
          <View className="flex flex-col gap-4 w-full">
            <Progress
              value={progress}
              className="bg-primary/20"
              indicatorClassName="bg-primary"
            />
            <Text className="text-center font-medium text-muted-foreground text-lg">
              {Math.round(progress)}% complete
            </Text>
            <View className="flex flex-row gap-4 items-center bg-muted/50 rounded-lg p-4">
              <LogoIcon className="text-primary h-6 w-6" />
              <Text className="font-medium">{loadingMessage}</Text>
            </View>
            <Button
              onPress={cancelMatchmaking}
              size="lg"
              variant="outline"
              className="flex flex-row gap-2 items-center"
            >
              <X size={24} className="text-foreground" />
              <Text>Cancel Search</Text>
            </Button>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  );
}
