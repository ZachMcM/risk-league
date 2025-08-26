import { useQuery } from "@tanstack/react-query";
import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { getUserRank } from "~/endpoints";
import { authClient } from "~/lib/auth-client";

export function SplashScreenController() {
  const { isPending: isSessionPending, data: currentUserData } =
    authClient.useSession();
  const { isPending: isUserRankPending } = useQuery({
    queryKey: ["user", currentUserData?.user.id, "rank"],
    queryFn: getUserRank,
  });

  useEffect(() => {
    if (!isSessionPending && !isUserRankPending) {
      SplashScreen.hideAsync();
    }
  }, [isSessionPending, isUserRankPending]);

  return null;
}
