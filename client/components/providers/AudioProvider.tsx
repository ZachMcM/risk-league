import { useAudioPlayer } from "expo-audio";
import { createContext, ReactNode, useContext } from "react";

type AudioProviderValues = {
  playCashRegister: () => void;
  playCavalry: () => void;
};

const AudioContext = createContext<null | AudioProviderValues>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const cashRegisterPlayer = useAudioPlayer(
    require("~/assets/audio/cash_register.mp3")
  );
  const cavalryPlayer = useAudioPlayer(
    require("~/assets/audio/cavalry.mp3")
  );

  return (
    <AudioContext.Provider
      value={{
        playCashRegister: () => cashRegisterPlayer.play(),
        playCavalry: () => cavalryPlayer.play(),
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext) as AudioProviderValues;
}
