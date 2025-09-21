import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator } from "react-native";
import FinalizeParlayForm from "~/components/parlays/FinalizeParlayForm";
import { getMatch } from "~/endpoints";
import { authClient } from "~/lib/auth-client";
import { MIN_PARLAYS_REQUIRED, MIN_PCT_TOTAL_STAKED } from "~/lib/config";
import { ExtendedMatchUser } from "~/types/match";

export default function FinalizeParlay() {
  const searchParams = useLocalSearchParams<{ matchId: string }>();
  const matchId = parseInt(searchParams.matchId);

  const { data: match, isPending } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => await getMatch(matchId),
  });

  const { data: currentUserData } = authClient.useSession();

  const { balance, totalParlays, totalStaked, startingBalance } =
    match?.matchUsers.find(
      (matchUser: ExtendedMatchUser) =>
        matchUser.user.id == currentUserData?.user.id!
    )!;

  return isPending ? (
    <ActivityIndicator className="text-foreground" />
  ) : (
    <FinalizeParlayForm
      totalStaked={totalStaked}
      minParlays={MIN_PARLAYS_REQUIRED}
      minTotalStaked={startingBalance * MIN_PCT_TOTAL_STAKED}
      totalParlays={totalParlays}
      balance={balance}
      matchId={matchId}
    />
  );
}
