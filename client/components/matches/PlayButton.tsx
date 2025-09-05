import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ReactNode, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { io } from "socket.io-client";
import { toast } from "sonner-native";
import { getTodayProps } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { League } from "~/lib/config";
import { CircleX } from "~/lib/icons/CircleX";
import { Play } from "~/lib/icons/Play";
import { cn } from "~/utils/cn";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import LeagueLogo from "../ui/league-logos/LeagueLogo";
import { Text } from "../ui/text";

const messages = [
  "Finding the best match...",
  "Searching for opponent...",
  "Analyzing ranks...",
  "Hang tight, almost there...",
];

export default function PlayButton({
  league,
}: {
  league: League;
  children?: ReactNode;
}) {
  const mlbImage = require("~/assets/images/mlb.jpeg");
  const nbaImage = require("~/assets/images/nba.jpeg");
  const nflImage = require("~/assets/images/nfl.jpeg");
  const ncaabbImage = require("~/assets/images/ncaabb.jpeg");
  const ncaafbImage = require("~/assets/images/ncaafb.jpeg");

  const { data: props, isPending: arePropsPending } = useQuery({
    queryKey: ["props", league],
    queryFn: async () =>
      await getTodayProps({
        league,
      }),
    staleTime: 1440 * 60 * 1000,
  });

  const queryClient = useQueryClient();
  const { data: currentUserData } = authClient.useSession();
  const userId = currentUserData?.user.id!;

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(messages[0]);

  const startMatchmaking = () => {
    setIsLoading(true);
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

    socket.on("match-found", async ({ matchId }: { matchId: string }) => {
      console.log(`Found match id: ${matchId}`);
      clearInterval(interval);
      setProgress(100);
      setLoadingMessage("Opponent found!");
      toast.success("Opponent found!");
      await queryClient.invalidateQueries({
        queryKey: ["matches", currentUserData?.user.id, "unresolved"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["match", matchId],
      });
      socket.disconnect();
      setIsLoading(false);
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
      setIsLoading(false);
    });
  };

  const cancelMatchmaking = () => {
    socketRef.current?.emit("cancel-search");
    socketRef.current?.disconnect();
    setIsLoading(false);
    setProgress(0);
  };

  function handlePress() {
    if (isLoading) {
      cancelMatchmaking();
    } else {
      startMatchmaking();
    }
  }

  const uniqueGameIds = [...new Set(props?.map((prop) => prop.game.gameId))];

  return (
    <Card
      className={cn(
        "w-72",
        arePropsPending && "animate-pulse",
        !arePropsPending && props?.length == 0 && "opacity-60"
      )}
    >
      <CardContent className="p-0 flex-1 flex flex-col">
        <View className={"relative overflow-hidden h-36 rounded-t-2xl"}>
          <Image
            contentFit="cover"
            source={
              league == "MLB"
                ? mlbImage
                : league == "NBA"
                ? nbaImage
                : league == "NFL"
                ? nflImage
                : league == "NCAAFB"
                ? ncaafbImage
                : ncaabbImage
            }
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <View className="flex flex-col items-center gap-4 p-4 flex-1">
          <View className="flex flex-col gap-3 items-center">
            <View className="flex flex-row items-center gap-2">
              <LeagueLogo size={28} league={league} />
              <Text className="font-extrabold text-2xl uppercase">
                {league}
              </Text>
            </View>
            {isLoading && (
              <ActivityIndicator className="text-muted-foreground" />
            )}
            {isLoading ? (
              <View className="flex flex-row items-center justify-center gap-2 max-w-xs">
                <Text className="text-muted-foreground">
                  {progress}% {loadingMessage}
                </Text>
              </View>
            ) : (
              <Text className="text-muted-foreground text-center">
                {arePropsPending ? "..." : props?.length} Props •{" "}
                {arePropsPending ? "..." : uniqueGameIds.length} Games
              </Text>
            )}
          </View>
          <Button
            disabled={arePropsPending || !props || props.length == 0}
            onPress={handlePress}
            className="flex flex-row items-center gap-2 w-full"
            variant={isLoading ? "destructive" : "default"}
          >
            <Text className="font-semibold">
              {isLoading ? "Cancel" : "Play"}
            </Text>
            {isLoading ? (
              <CircleX className="text-destructive" size={16} />
            ) : (
              <Play className="text-foreground" size={16} />
            )}
          </Button>
        </View>
      </CardContent>
    </Card>
  );
}
