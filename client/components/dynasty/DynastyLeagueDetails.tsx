import { useEffect } from "react";
import { toast } from "sonner-native";
import { authClient } from "~/lib/auth-client";
import { MIN_PARLAYS_REQUIRED, MIN_PCT_TOTAL_STAKED } from "~/lib/config";
import { DynastyLeague, DynastyLeagueUser } from "~/types/dynastyLeague";
import { Alert, AlertTitle } from "../ui/alert";
import { Icon } from "../ui/icon";
import { AlertTriangle } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "../ui/text";
import { Badge } from "../ui/badge";

export default function DynastyLeagueDetails({
  dynastyLeagueUsers,
  dynastyLeague,
}: {
  dynastyLeagueUsers: DynastyLeagueUser[];
  dynastyLeague: DynastyLeague;
}) {
  const { data: currentUserData } = authClient.useSession();

  const currentUserIndex = dynastyLeagueUsers?.findIndex(
    (dynastyLeagueUser) => dynastyLeagueUser.userId == currentUserData?.user.id
  )!;
  const currentDynastyLeagueUser = dynastyLeagueUsers?.at(currentUserIndex!)!;

  const minTotalStaked = Math.round(
    MIN_PCT_TOTAL_STAKED * currentDynastyLeagueUser.startingBalance
  );

  useEffect(() => {
    let stakeToast: string | number | undefined;
    let parlaysToast: string | number | undefined;

    if (!dynastyLeague.resolved) {
      if (currentDynastyLeagueUser.totalStaked < minTotalStaked) {
        stakeToast = toast.custom(
          <Alert variant="destructive">
            <Icon as={AlertTriangle} className="text-destructive" size={20} />
            <AlertTitle className="text-foreground">
              You need to stake $
              {minTotalStaked - currentDynastyLeagueUser.totalStaked} more!
            </AlertTitle>
          </Alert>,
          {
            duration: Infinity,
            position: "bottom-center",
          }
        );
      }
      if (currentDynastyLeagueUser.totalParlays < MIN_PARLAYS_REQUIRED) {
        parlaysToast = toast.custom(
          <Alert variant="destructive">
            <AlertTriangle className="text-destructive" size={20} />
            <AlertTitle className="text-foreground">
              You need to create{" "}
              {MIN_PARLAYS_REQUIRED - currentDynastyLeagueUser.totalParlays}{" "}
              more parlay
              {MIN_PARLAYS_REQUIRED - currentDynastyLeagueUser.totalParlays >
                1 && "s"}
              !
            </AlertTitle>
          </Alert>,
          {
            duration: Infinity,
            position: "bottom-center",
          }
        );
      }
    }

    return () => {
      if (stakeToast) {
        toast.dismiss(stakeToast);
      }
      if (parlaysToast) {
        toast.dismiss(parlaysToast);
      }
    };
  }, [dynastyLeague, dynastyLeagueUsers]);

  return (
    <View className="flex flex-row items-center gap-3">
      <View className="flex flex-row items-center gap-1">
        <Text className="text-xl font-semibold">Balance:</Text>
        <Text className="text-primary font-bold text-xl">
          ${currentDynastyLeagueUser.balance}
        </Text>
      </View>
      <View className="flex flex-row items-center gap-1">
        <Text className="text-xl font-semibold">Ranking:</Text>
        <Badge variant={currentUserIndex + 1 == 1 ? "success" : "default"}>
          <Text className="text-base">#{currentUserIndex + 1}</Text>
        </Badge>
      </View>
    </View>
  );
}
