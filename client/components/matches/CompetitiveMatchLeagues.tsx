import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { getTodayPropsCount } from "~/endpoints";
import { League, LEAGUES } from "~/lib/config";
import { Text } from "../ui/text";
import { Button } from "../ui/button";
import LeagueLogo from "../ui/league-logo";
import { cn } from "~/utils/cn";
import { Icon } from "../ui/icon";
import { Play } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner-native";
import { authClient } from "~/lib/auth-client";
import { router } from "expo-router";
import { useAudio } from "../providers/AudioProvider";
import { CircleX } from "~/lib/icons/CircleX";

const messages = [
  "Finding a match...",
  "Analyzing ranks...",
  "Almost there...",
];

export default function CompetitiveMatchLeagues() {
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const queryClient = useQueryClient();
  const { data: currentUserData } = authClient.useSession();
  const userId = currentUserData?.user.id!;

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(messages[0]);

  const { playCavalry } = useAudio();

  const leagueQueries = useQueries({
    queries: LEAGUES.map((league) => ({
      queryKey: ["props-games-count", league],
      queryFn: () => getTodayPropsCount(league),
      staleTime: 60 * 1000,
    })),
  });

  const leaguesList = LEAGUES.map((league, index) => ({
    league,
    propCount: leagueQueries[index]?.data?.availableProps || 0,
    gamesCount: leagueQueries[index]?.data?.totalGames || 0,
    isLoading: leagueQueries[index]?.isPending,
  })).sort((a, b) => b.propCount - a.propCount);

  const startMatchmaking = () => {
    if (!selectedLeague) return;

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
      auth: { userId: userId.toString(), league: selectedLeague },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("match-found", async ({ matchId }: { matchId: string }) => {
      clearInterval(interval);
      setProgress(100);

      playCavalry();
      setLoadingMessage("Opponent found!");
      toast.success("Opponent found!");
      await queryClient.invalidateQueries({
        queryKey: ["match-ids", currentUserData?.user.id, "unresolved"],
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

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        if (isLoading) {
          cancelMatchmaking();
          setIsLoading(false);
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      if (isLoading) {
        cancelMatchmaking();
        setIsLoading(false);
      }
      subscription?.remove();
    };
  }, [isLoading]);

  function handlePress() {
    if (isLoading) {
      cancelMatchmaking();
    } else {
      startMatchmaking();
    }
  }

  const selectedLeagueData = selectedLeague
    ? leaguesList.find((l) => l.league === selectedLeague)
    : null;

  return (
    <View className="flex flex-col px-6 gap-4 w-full">
      <Text className="text-3xl font-bold">Competitive</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          display: "flex",
          gap: 8,
          paddingRight: 16,
        }}
      >
        {leaguesList.map(({ league, propCount }) => (
          <Button
            disabled={propCount == 0}
            onPress={() => {
              if (selectedLeague == league) {
                setSelectedLeague(null);
              } else {
                setSelectedLeague(league);
              }
            }}
            variant="secondary"
            className={cn(
              "flex flex-row items-center gap-2.5 rounded-xl border",
              selectedLeague === league && "border-primary bg-primary/20"
            )}
            key={league}
          >
            <LeagueLogo size={20} league={league} />
            <Text className="font-semibold">{league}</Text>
          </Button>
        ))}
      </ScrollView>
      <Button
        disabled={!selectedLeague}
        onPress={handlePress}
        className="flex flex-row items-center gap-2"
        size="lg"
        variant={isLoading ? "destructive" : "default"}
      >
        {isLoading ? (
          <Icon size={18} className="text-destructive" as={CircleX} />
        ) : (
          <Icon size={18} as={Play} />
        )}
        <Text className="font-bold">{isLoading ? "Cancel" : "Play"}</Text>
      </Button>
      {isLoading ? (
        <View className="flex flex-row items-center justify-center gap-2">
          <ActivityIndicator className="text-muted-foreground" />
          <Text className="text-muted-foreground">
            {progress}% {loadingMessage}
          </Text>
        </View>
      ) : (
        selectedLeagueData && (
          <Text className="text-muted-foreground font-medium text-center">
            {selectedLeagueData.propCount} Props •{" "}
            {selectedLeagueData.gamesCount} Games
          </Text>
        )
      )}
    </View>
  );
}
