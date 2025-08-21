import { createContext, ReactNode, useContext, useState } from "react";
import { View } from "react-native";
import { Prop } from "~/types/prop";
import { Text } from "../ui/text";
import { Button } from "../ui/button";
import { truncate } from "lodash";
import { router, useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Pick = {
  prop: Prop;
  choice: string;
};

export type CreateParlayProviderTypes = {
  picks: Pick[];
  addPick: (pick: Pick) => void;
  removePick: (propId: number) => void;
  updatePick: (propId: number, newPick: string) => void;
  clearParlay: () => void;
  getPicksCount: () => number;
  getPickChoice: (propId: number) => string | undefined;
  isPropPicked: (propId: number) => boolean;
};

const ParlayContext = createContext<CreateParlayProviderTypes | null>(null);

export function CreateParlayProvider({ children }: { children: ReactNode }) {
  const [picks, setPicks] = useState<Pick[]>([]);

  function removePick(propId: number) {
    const updatedPicks = picks.filter((pick) => pick.prop.id != propId);
    setPicks(updatedPicks);
  }

  function updatePick(propId: number, newPick: string) {
    const updatedPicks = picks.map((pick) =>
      pick.prop.id === propId ? { ...pick, choice: newPick } : pick,
    );
    setPicks(updatedPicks);
  }

  function clearParlay() {
    setPicks([]);
  }

  function getPicksCount() {
    return picks.length;
  }

  function addPick(newPick: Pick) {
    if (picks.length + 1 > 6) {
      toast.error("Sorry, you can't have more than 6 picks");
      return;
    }
    setPicks([...picks, newPick]);
  }

  function getPickChoice(propId: number) {
    return picks.find((pick) => pick.prop.id == propId)?.choice;
  }

  function isPropPicked(propId: number) {
    return !!picks.find((pick) => pick.prop.id == propId);
  }

  return (
    <ParlayContext.Provider
      value={{
        picks,
        addPick,
        removePick,
        updatePick,
        clearParlay,
        getPicksCount,
        getPickChoice,
        isPropPicked,
      }}
    >
      {children}
    </ParlayContext.Provider>
  );
}

export function useCreateParlay() {
  return useContext(ParlayContext) as CreateParlayProviderTypes;
}

export function CreateParlayFooter() {
  const { picks } = useCreateParlay();
  const searchParams = useLocalSearchParams<{ matchId: string }>();
  const matchId = parseInt(searchParams.matchId);
  const insets = useSafeAreaInsets();

  if (picks.length == 0) {
    return null;
  }

  return (
    <View
      className="flex flex-row items-center bg-background justify-between gap-4 border-t border-border p-4"
      style={{ paddingBottom: insets.bottom }}
    >
      {/* TODO replace with images */}
      <Text className="font-semibold text-muted-foreground max-w-[50%]">
        {picks.length == 0
          ? "Make at least 2 picks..."
          : truncate(
              picks
                .map((pick) => pick.prop.player.name)
                .filter((e, i, self) => i === self.indexOf(e))
                .join(", "),
              {
                length: 25,
              },
            )}
      </Text>
      <Button
        variant="foreground"
        className="flex flex-row items-center gap-3 rounded-full"
        onPress={() =>
          router.navigate({
            pathname: "/match/[matchId]/finalize-parlay",
            params: { matchId },
          })
        }
      >
        <Text>View Entries</Text>
        <View className="h-8 w-8 rounded-full bg-background flex flex-row justify-center items-center">
          <Text className="text-foreground font-bold">{picks.length}</Text>
        </View>
      </Button>
    </View>
  );
}
