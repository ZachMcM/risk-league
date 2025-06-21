export class MissingFieldsError extends Error {
  public status = 400;
  public missing: string[];

  constructor(missing: string[]) {
    super("Missing or invalid fields");
    this.name = "MissingFieldsError";
    this.missing = missing;
  }
}