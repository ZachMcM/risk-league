import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { authClient } from "~/lib/auth-client";

export function SplashScreenController() {
  const { isPending: isSessionPending } = authClient.useSession();

  useEffect(() => {
    if (!isSessionPending) {
      SplashScreen.hideAsync();
    }
  }, [isSessionPending]);

  return null;
}
