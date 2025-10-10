import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { createContext, ReactNode, useContext, useEffect } from "react";

type AudioProviderValues = {
  playCashRegister: () => void;
  playCavalry: () => void;
};

const AudioContext = createContext<null | AudioProviderValues>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const cashRegisterPlayer = useAudioPlayer(
    require("~/assets/audio/cash_register.mp3")
  );
  const cavalryPlayer = useAudioPlayer(require("~/assets/audio/cavalry.mp3"));

  useEffect(() => {
    // Configure audio to play even when device is in silent mode
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });
  }, []);

  return (
    <AudioContext.Provider
      value={{
        playCashRegister: () => {
          cashRegisterPlayer.seekTo(0);
          cashRegisterPlayer.play();
        },
        playCavalry: () => {
          cavalryPlayer.seekTo(0)
          cavalryPlayer.play()
        },
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext) as AudioProviderValues;
}
