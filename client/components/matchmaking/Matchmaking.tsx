import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { io } from "socket.io-client";
import { Trophy } from "~/lib/icons/Trophy";
import { X } from "~/lib/icons/X";
import { useSession } from "../providers/SessionProvider";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Progress } from "../ui/progress";
import { Text } from "../ui/text";

const messages = [
  "Matching skill levels...",
  "Searching for worthy opponents...",
  "Analyzing ranks...",
  "Finding the perfect match...",
  "Hang tight, almost there...",
];

export default function Matchmaking() {
  const router = useRouter();

  const { session } = useSession();
  const userId = session?.user.id!;

  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(messages[0]);

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      // Random increment between 3 and 25, but never let it reach 100%
      setProgress((prev) => {
        const randomIncrement = Math.floor(Math.random() * 23) + 3; // 3-25
        const newProgress = prev + randomIncrement;
        // Cap at 95% to never reach 100% naturally
        return Math.min(newProgress, 95);
      });

      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 2000); // change every 2 seconds

    const socket = io(`${process.env.EXPO_PUBLIC_API_URL}/matchmaking`, {
      query: { userId },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () =>
      console.log("Connected to matchmaking namespace")
    );

    socket.on("match-found", ({ opponentId }: { opponentId: string }) => {
      console.log("Matched with opponent");
      clearInterval(interval);
      setProgress(100);
      setLoadingMessage("Opponent found!");
      // TODO
    });

    return () => {
      clearInterval(interval);
      socket.emit("cancel-search");
      socket.disconnect();
    };
  }, [userId]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-center gap-4">
        <View className="h-20 w-20 border-2 border-primary/20 bg-primary/10 flex items-center justify-center rounded-full">
          <Trophy size={32} className="text-primary" />
        </View>
        <CardTitle className="font-extrabold text-3xl">
          Finding Opponent
        </CardTitle>
        <CardDescription className="text-xl text-center font-medium">
          We're matching you with the perfect competitor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <View className="flex flex-col gap-4">
          <Progress
            value={progress}
            className="bg-primary/10"
            indicatorClassName="bg-primary"
          />
          <Text className="text-center font-medium text-muted-foreground text-lg">
            {Math.round(progress)}% complete
          </Text>
          <View className="flex flex-row gap-4 items-center bg-muted/50 rounded-lg p-4">
            <Trophy size={24} className="text-primary" />
            <Text className="font-medium text-xl">{loadingMessage}</Text>
          </View>
          <Button
            onPress={() => {
              socketRef.current?.emit("cancel-search");
              socketRef.current?.disconnect();
              router.replace("/(tabs)");
            }}
            size="lg"
            variant="outline"
            className="flex flex-row gap-2 items-center"
          >
            <X size={24} className="text-foreground" />
            <Text>Cancel Search</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );
}
