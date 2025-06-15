export type Session =
  | {
      user: {
        id: string;
        email: string;
        username: string;
        image: string;
      };
    }
  | null
  | undefined;

export type SessionProviderValues = {
  session: Session;
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

