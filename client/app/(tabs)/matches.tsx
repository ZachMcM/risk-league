import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, View } from "react-native";
import MatchTabs from "~/components/matches/MatchTabs";
import { Container } from "~/components/ui/container";
import { getMatches } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function Matches() {
  const { data } = authClient.useSession();

  const { data: unresolvedMatches, isPending: unresolvedMatchesPending } =
    useQuery({
      queryKey: ["matches", data?.user.id, "unresolved"],
      queryFn: async () => await getMatches(false),
    });

  const { data: resolvedMatches, isPending: resolvedMatchesPending } = useQuery(
    {
      queryKey: ["matches", data?.user.id, "resolved"],
      queryFn: async () => await getMatches(true),
    },
  );

  return (
    <Container className="pt-2 pb-0">
      {resolvedMatchesPending || unresolvedMatchesPending ? (
        <ActivityIndicator className="text-foreground p-4" />
      ) : (
        resolvedMatches &&
        unresolvedMatches && (
          <MatchTabs
            unresolvedMatches={unresolvedMatches}
            resolvedMatches={resolvedMatches}
          />
        )
      )}
    </Container>
  );
}
