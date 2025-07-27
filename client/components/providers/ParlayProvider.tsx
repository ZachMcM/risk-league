import { createContext, ReactNode, useContext, useState } from "react";
import { View } from "react-native";
import { Prop } from "~/types/props";
import { Text } from "../ui/text";
import { Button } from "../ui/button";
import { truncate } from "lodash";
import { router, useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ParlayPick = {
  prop: Prop;
  pick: string;
};

export type ParlayProviderTypes = {
  parlayPicks: ParlayPick[];
  addPick: (parlayPick: ParlayPick) => void;
  removePick: (propId: number) => void;
  updatePick: (propId: number, newPick: string) => void;
  clearParlay: () => void;
  getParlayCount: () => number;
  getPick: (propId: number) => string | undefined;
  isPropPicked: (propId: number) => boolean;
};

const ParlayContext = createContext<ParlayProviderTypes | null>(null);

export function ParlayProvider({ children }: { children: ReactNode }) {
  const [parlayPicks, setParlayPicks] = useState<ParlayPick[]>([]);

  function removePick(propId: number) {
    const updatedPicks = parlayPicks.filter((pick) => pick.prop.id != propId);
    setParlayPicks(updatedPicks);
  }

  function updatePick(propId: number, newPick: string) {
    const updatedPicks = parlayPicks.map((pick) =>
      pick.prop.id === propId ? { ...pick, pick: newPick } : pick
    );
    setParlayPicks(updatedPicks);
  }

  function clearParlay() {
    setParlayPicks([]);
  }

  function getParlayCount() {
    return parlayPicks.length;
  }

  function addPick(parlayPick: ParlayPick) {
    if (parlayPicks.length + 1 > 6) {
      toast.error("Sorry, you can't have more than 6 picks");
      return;
    }
    const playerExists = parlayPicks.find(
      (pick) => pick.prop.player.id == parlayPick.prop.playerId
    );
    if (playerExists) {
      toast.error("Sorry, you can't make multiple picks for the same player");
      return;
    }
    setParlayPicks([...parlayPicks, parlayPick]);
  }

  function getPick(propId: number) {
    return parlayPicks.find((pick) => pick.prop.id == propId)?.pick;
  }

  function isPropPicked(propId: number) {
    return !!parlayPicks.find((pick) => pick.prop.id == propId);
  }

  return (
    <ParlayContext.Provider
      value={{
        parlayPicks,
        addPick,
        removePick,
        updatePick,
        clearParlay,
        getParlayCount,
        getPick,
        isPropPicked,
      }}
    >
      {children}
    </ParlayContext.Provider>
  );
}

export function useParlayPicks() {
  return useContext(ParlayContext) as ParlayProviderTypes;
}

export function ParlayPickerFooter() {
  const { parlayPicks } = useParlayPicks();
  const searchParams = useLocalSearchParams<{ matchId: string }>();
  const matchId = parseInt(searchParams.matchId);
  const insets = useSafeAreaInsets();

  if (parlayPicks.length <= 0) {
    return null;
  }

  return (
    <View
      className="flex flex-row items-center justify-between gap-4 border-t border-border p-4"
      style={{ marginBottom: insets.bottom }}
    >
      {/* TODO replace with images */}
      <Text className="font-semibold text-muted-foreground">
        {truncate(
          parlayPicks
            .map((pick) => pick.prop.player.name)
            .filter((e, i, self) => i === self.indexOf(e))
            .join(", "),
          {
            length: 30,
          }
        )}
      </Text>
      <Button
        variant="foreground"
        className="flex flex-row items-center gap-3 rounded-full"
        onPress={() =>
          router.navigate({
            pathname: "/matches/[matchId]/finalize-parlay",
            params: { matchId },
          })
        }
      >
        <Text>View Entries</Text>
        <View className="h-8 w-8 rounded-full bg-background flex flex-row justify-center items-center">
          <Text className="text-foreground font-bold">
            {parlayPicks.length}
          </Text>
        </View>
      </Button>
    </View>
  );
}
