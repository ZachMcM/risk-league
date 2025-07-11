import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment } from "react";
import { Button } from "~/components/ui/button";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { getMatch } from "~/endpoints";
import { MessageCircle } from "~/lib/icons/MessageCircle";

export default function Match() {
  const searchParams = useLocalSearchParams() as { id: string };
  const id = parseInt(searchParams.id);

  const router = useRouter();

  const { data: match, isPending: isMatchPending } = useQuery({
    queryKey: ["match", id],
    queryFn: async () => await getMatch(id),
  });

  return (
    <Fragment>
      <ScrollContainer></ScrollContainer>
      <Button
        onPress={() =>
          router.push({
            pathname: "/matches/[id]/messages",
            params: { id },
          })
        }
        size="icon"
        className="rounded-full absolute bottom-6 right-6"
      >
        <MessageCircle className="text-foreground" />
      </Button>
    </Fragment>
  );
}
