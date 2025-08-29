import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator } from "react-native";
import FinalizeParlayForm from "~/components/parlays/FinalizeParlayForm";
import { getMatch } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function FinalizeParlay() {
  const searchParams = useLocalSearchParams<{ matchId: string }>();
  const matchId = parseInt(searchParams.matchId);

  const { data: match, isPending } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => await getMatch(matchId),
  });

  const { data: currentUserData } = authClient.useSession();

  const { balance } = match?.matchUsers.find(
    (matchUser) => matchUser.user.id == currentUserData?.user.id!
  )!;

  return isPending ? (
    <ActivityIndicator className="text-foreground" />
  ) : (
    <FinalizeParlayForm balance={balance} matchId={matchId} />
  );
}
