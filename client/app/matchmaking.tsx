import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { io } from "socket.io-client";
import { Trophy } from "~/lib/icons/Trophy";
import { Users } from "~/lib/icons/Users";
import { X } from "~/lib/icons/X";
import { useSession } from "~/components/providers/SessionProvider";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Text } from "~/components/ui/text";
import { toast } from "sonner-native";
import { Container } from "~/components/ui/container";

const messages = [
  "Matching skill levels...",
  "Searching for opponent...",
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
        const randomIncrement = Math.floor(Math.random() * 6) + 5; // 3-25
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

    socket.on("match-found", ({ matchId }: { matchId: string }) => {
      console.log(`Found match id: ${matchId}`);
      clearInterval(interval);
      setProgress(100);
      setLoadingMessage("Opponent found!");
      toast.success("Opponent found!");
      router.replace({
        pathname: "/matches/[id]",
        params: { id: matchId },
      });
    });

    socket.on("matchmaking-failed", () => {
      console.log("Failed to create match");
      clearInterval(interval);
      setProgress(0);
      setLoadingMessage("Matchmaking failed...");
      toast.error("Matchmaking failed");
      router.replace("/(tabs)");
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [userId]);

  return (
    <Container>
      <View className="flex flex-1 justify-center items-center">
        <Card>
          <CardHeader className="flex flex-col items-center gap-4">
            <View className="relative mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Users size={28} className="text-primary" />
              <View className="absolute inset-0 border-2 border-primary/20 rounded-full animate-spin border-t-primary" />
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
                className="bg-primary/10 h-3"
                indicatorClassName="bg-primary"
              />
              <Text className="text-center font-medium text-muted-foreground text-lg">
                {Math.round(progress)}% complete
              </Text>
              <View className="flex flex-row gap-4 items-center bg-muted/50 rounded-lg p-4">
                <Trophy size={20} className="text-primary" />
                <Text className="font-medium">{loadingMessage}</Text>
              </View>
              <Button
                onPress={() => {
                  socketRef.current?.emit("cancel-search");
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
      </View>
    </Container>
  );
}
