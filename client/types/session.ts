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
