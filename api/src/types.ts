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

export class MissingFieldsError extends Error {
  public status = 400;
  public missing: string[];

  constructor(missing: string[]) {
    super("Missing or invalid fields");
    this.name = "MissingFieldsError";
    this.missing = missing;
  }
}
