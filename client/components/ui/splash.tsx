import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { authClient } from "~/lib/auth-client";

export function SplashScreenController() {
  const { isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending) {
      SplashScreen.hideAsync();
    }
  }, [isPending]);

  return null;
}
