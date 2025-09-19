import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as relations from "./relations";
import * as schema from "./schema";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 50, // maximum number of clients in pool
  idleTimeoutMillis: 20000, // close idle clients after 20 seconds
  connectionTimeoutMillis: 10000, // timeout when connecting new client
});

export const db = drizzle(pool, {
  schema: { ...schema, ...relations },
});
