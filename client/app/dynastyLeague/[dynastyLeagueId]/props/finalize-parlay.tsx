import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator } from "react-native";
import FinalizeParlayForm from "~/components/parlays/FinalizeParlayForm";
import { getDynastyLeague, getDynastyLeagueUsers } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function FinalizeParlay() {
  const searchParams = useLocalSearchParams<{ dynastyLeagueId: string }>();
  const dynastyLeagueId = parseInt(searchParams.dynastyLeagueId);

  const { data: dynastyLeagueUsers, isPending: areUsersPending } = useQuery({
    queryKey: ["dynasty-league", dynastyLeagueId, "users"],
    queryFn: async () => await getDynastyLeagueUsers(dynastyLeagueId),
  });

  const { data: dynastyLeague, isPending: isDynastyLeaguePending } = useQuery({
    queryKey: ["dynasty-league", dynastyLeagueId],
    queryFn: async () => await getDynastyLeague(dynastyLeagueId),
  });

  const currentUserIndex = dynastyLeagueUsers?.findIndex(
    (dynastyLeagueUser) => dynastyLeagueUser.userId == currentUserData?.user.id
  )!;
  const currentDynastyLeagueUser = dynastyLeagueUsers?.at(currentUserIndex!)!;

  const { data: currentUserData } = authClient.useSession();

  return areUsersPending || isDynastyLeaguePending ? (
    <ActivityIndicator className="text-foreground" />
  ) : (
    dynastyLeague && (
      <FinalizeParlayForm
        balance={currentDynastyLeagueUser.balance}
        totalStaked={currentDynastyLeagueUser.totalStaked}
        totalParlays={currentDynastyLeagueUser.totalParlays}
        minParlays={dynastyLeague.minParlays}
        minTotalStaked={dynastyLeague.minTotalStaked}
        dynastyLeagueId={dynastyLeagueId}
      />
    )
  );
}
