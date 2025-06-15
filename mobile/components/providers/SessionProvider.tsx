import {
  sessionRequest,
  signInRequest,
  signOutRequest,
  signUpRequest,
} from "@/endpoints";
import { SessionProviderValues } from "@/types/session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useContext } from "react";

const SessionContext = createContext<SessionProviderValues | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: session,
    isPending: isSessionPending,
  } = useQuery({
    queryKey: ["session"],
    queryFn: sessionRequest,
  });

  const { mutate: signIn, isPending: isSignInPending } = useMutation({
    mutationFn: signInRequest,
    onError: (err) => {
      console.log(err);
      // TODO
    },
    onSuccess: () => {
      // TODO
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  const { mutate: signUp, isPending: isSignUpPending } = useMutation({
    mutationFn: signUpRequest,
    onError: (err) => {
      console.log(err);
      // TODO
    },
    onSuccess: () => {
      // TODO
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  const { mutate: signOut, isPending: isSignOutPending } = useMutation({
    mutationFn: signOutRequest,
    onError: (err) => {
      // TODO
    },
    onSuccess: () => {
      // TODO
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  return (
    <SessionContext.Provider
      value={{
        session,
        signIn,
        signOut,
        signUp,
        isSessionPending,
        isSignInPending,
        isSignUpPending,
        isSignOutPending,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext) as SessionProviderValues;
}