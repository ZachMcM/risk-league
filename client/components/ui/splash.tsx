import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { useSession } from "../providers/SessionProvider";

export function SplashScreenController() {
  const { isSessionPending } = useSession();

  useEffect(() => {
    if (!isSessionPending) {
      // Add small delay to prevent flash
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 300);
    }
  }, [isSessionPending]);

  return null;
}
