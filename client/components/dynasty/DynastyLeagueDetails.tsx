import { AlertTriangle } from "lucide-react-native";
import { useEffect } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";
import { authClient } from "~/lib/auth-client";
import { DynastyLeague, DynastyLeagueUser } from "~/types/dynastyLeague";
import { Alert, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";

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

  useEffect(() => {
    let stakeToast: string | number | undefined;
    let parlaysToast: string | number | undefined;

    if (new Date().toISOString() < dynastyLeague.endDate) {
      if (currentDynastyLeagueUser.totalStaked < dynastyLeague.minTotalStaked) {
        stakeToast = toast.custom(
          <Alert variant="destructive">
            <Icon as={AlertTriangle} className="text-destructive" size={20} />
            <AlertTitle className="text-foreground">
              You need to stake $
              {dynastyLeague.minTotalStaked -
                currentDynastyLeagueUser.totalStaked}{" "}
              more!
            </AlertTitle>
          </Alert>,
          {
            duration: Infinity,
            position: "bottom-center",
          }
        );
      }
      if (currentDynastyLeagueUser.totalParlays < dynastyLeague.minParlays) {
        parlaysToast = toast.custom(
          <Alert variant="destructive">
            <AlertTriangle className="text-destructive" size={20} />
            <AlertTitle className="text-foreground">
              You need to create{" "}
              {dynastyLeague.minParlays - currentDynastyLeagueUser.totalParlays}{" "}
              more parlay
              {dynastyLeague.minParlays -
                currentDynastyLeagueUser.totalParlays >
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
      {currentDynastyLeagueUser.rank && (
        <View className="flex flex-row items-center gap-1">
          <Text className="text-xl font-semibold">Ranking:</Text>
          <Text className="text-primary font-bold text-xl">
            #{currentDynastyLeagueUser.rank}
          </Text>
        </View>
      )}
    </View>
  );
}
