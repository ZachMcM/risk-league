export type TokenPayload = {
  userId: string;
  email: string;
};

export type RegisterBody = {
  name?: string | null;
  username?: string | null;
  email?: string | null;
  password?: string | null;
};

export type SignInBody = {
  email?: string | null;
  password?: string | null;
};