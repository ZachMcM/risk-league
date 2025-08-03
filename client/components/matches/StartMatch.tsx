import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StartMatch() {
  const [matchLeague, setMatchLeague] = useState<null | "nba" | "mlb">(null);

  const insets = useSafeAreaInsets();

  return <View></View>;
}
