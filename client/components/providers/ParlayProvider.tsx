import { createContext, ReactNode, useContext, useState } from "react";
import { Prop } from "~/types/props";

type ParlayPick = {
  prop: Prop;
  option: "over" | "under";
};

export type ParlayProviderTypes = {
  parlayPicks: ParlayPick[];
  addPick: (parlayPick: ParlayPick) => void;
  removePick: (propId: number) => void;
  updatePick: (propId: number, newPick: "over" | "under") => void;
  clearParlay: () => void;
  getParlayCount: () => number;
  getPickOption: (propId: number) => "over" | "under" | undefined;
};

const ParlayContext = createContext<ParlayProviderTypes | null>(null);

export function ParlayProvider({ children }: { children: ReactNode }) {
  const [parlayPicks, setParlayPicks] = useState<ParlayPick[]>([]);

  function removePick(propId: number) {
    const updatedPicks = parlayPicks.filter((pick) => pick.prop.id != propId);
    setParlayPicks(updatedPicks);
  }

  function updatePick(propId: number, newPick: "over" | "under") {
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
    setParlayPicks([...parlayPicks, parlayPick]);
  }

  function getPickOption(propId: number) {
    return parlayPicks.find((pick) => pick.prop.id == propId)?.option;
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
        getPickOption
      }}
    >
      {children}
    </ParlayContext.Provider>
  );
}

export function useParlayPicks() {
  return useContext(ParlayContext) as ParlayProviderTypes;
}
