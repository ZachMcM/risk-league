import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator } from "react-native";
import FinalizeParlayForm from "~/components/parlays/FinalizeParlayForm";
import { getDynastyLeagueUsers } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function FinalizeParlay() {
  const searchParams = useLocalSearchParams<{ dynastyLeagueId: string }>();
  const dynastyLeagueId = parseInt(searchParams.dynastyLeagueId);

  const { data: dynastyLeagueUsers, isPending: areUsersPending } = useQuery({
    queryKey: ["dynasty-league", dynastyLeagueId, "users"],
    queryFn: async () => await getDynastyLeagueUsers(dynastyLeagueId),
  });

  const currentUserIndex = dynastyLeagueUsers?.findIndex(
    (dynastyLeagueUser) => dynastyLeagueUser.userId == currentUserData?.user.id
  )!;
  const currentDynastyLeagueUser = dynastyLeagueUsers?.at(currentUserIndex!)!;

  const { data: currentUserData } = authClient.useSession();

  return areUsersPending ? (
    <ActivityIndicator className="text-foreground" />
  ) : (
    <FinalizeParlayForm
      balance={currentDynastyLeagueUser.balance}
      dynastyLeagueId={dynastyLeagueId}
    />
  );
}
