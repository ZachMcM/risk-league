import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sessionRequest,
  signInRequest,
  signOutRequest,
  signUpRequest,
} from "endpoints";
import { useRouter } from "expo-router";
import { createContext, ReactNode, useContext } from "react";
import { toast } from "sonner-native";
import { User } from "~/types/user";

type SessionProviderValues = {
  session:
    | {
        user: {
          id: number;
          username: string;
          email: string;
          image: string | null;
        };
      }
    | undefined
    | null;
  signIn: ({ email, password }: { email: string; password: string }) => void;
  signOut: () => void;
  signUp: ({
    name,
    username,
    email,
    password,
  }: {
    name: string;
    username: string;
    password: string;
    email: string;
  }) => void;
  isSignInPending: boolean;
  isSignUpPending: boolean;
  isSessionPending: boolean;
  isSignOutPending: boolean;
};

const SessionContext = createContext<SessionProviderValues | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: session, isPending: isSessionPending } = useQuery({
    queryKey: ["session"],
    queryFn: sessionRequest,
  });

  const router = useRouter();

  const { mutate: signIn, isPending: isSignInPending } = useMutation({
    mutationFn: signInRequest,
    onError: (err) => {
      console.log(err);
      toast.error(err.message);
    },
    onSuccess: (data) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Sign in successful");
      router.navigate("/(tabs)");
    },
  });

  const { mutate: signUp, isPending: isSignUpPending } = useMutation({
    mutationFn: signUpRequest,
    onError: (err) => {
      console.log(err);
      toast.error(err.message);
    },
    onSuccess: (data) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Sign up successful");
      router.navigate("/(tabs)");
    },
  });

  const { mutate: signOut, isPending: isSignOutPending } = useMutation({
    mutationFn: signOutRequest,
    onError: (err) => {
      console.log(err);
      toast.error(err.message);
    },
    onSuccess: (data) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Sign out successful");
      router.navigate("/");
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
