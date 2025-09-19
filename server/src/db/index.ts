import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as relations from "./relations";
import * as schema from "./schema";
import { Pool } from "pg";

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...schema, ...relations },
});
