import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Container } from "~/components/ui/container";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import { getDynastyLeagueInvites, getDynastyLeagues } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export default function Dynasty() {
  const { data: currentUserData } = authClient.useSession();

  const { data: leagues, isPending: areLeaguesPending } = useQuery({
    queryKey: ["dynasty-leagues", currentUserData?.user.id!],
    queryFn: getDynastyLeagues,
  });

  const { data: invites, isPending: areInvitesPending } = useQuery({
    queryKey: ["dynasty-league-invitations", currentUserData?.user.id!],
    queryFn: getDynastyLeagueInvites,
  });

  const [tab, setTab] = useState(areLeaguesPending ? "my-leagues" : "discover");

  return (
    <Container className="pt-2 pb-0 px-0">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="my-leagues">
            <Text>My Leagues ({leagues?.length})</Text>
          </TabsTrigger>
          <TabsTrigger value="invites">
            <Text>Invites ({invites?.length})</Text>
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Text>Discover</Text>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </Container>
  );
}
