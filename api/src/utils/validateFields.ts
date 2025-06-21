import { MissingFieldsError } from "../types/MissingFieldsError";

type FieldGroup<T> = (keyof T)[];

// Utility for checking if a value is null, undefined, or empty string
function isMissing(value: any): boolean {
  return value == null || (typeof value === "string" && value.trim() === "");
}

export function assertRequiredFields<
  T extends Record<string, any>,
  K extends keyof T
>(
  obj: T,
  requiredFields: K[],
  atLeastOneGroups: FieldGroup<T>[] = []
): asserts obj is T & { [P in K]-?: NonNullable<T[P]> } {
  const missing: string[] = [];

  // Check strict required fields
  for (const field of requiredFields) {
    if (isMissing(obj[field])) {
      missing.push(String(field));
    }
  }

  // Check alternative required field groups
  for (const group of atLeastOneGroups) {
    const hasOne = group.some((field) => !isMissing(obj[field]));
    if (!hasOne) {
      missing.push(`one of: ${group.join(" or ")}`);
    }
  }

  if (missing.length > 0) {
    throw new MissingFieldsError(missing);
  }
}
