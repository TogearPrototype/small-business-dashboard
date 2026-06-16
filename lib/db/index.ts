import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Neon connection. Only instantiated when USE_DATABASE=true and DATABASE_URL
 * is present; otherwise the app uses the in-memory store (lib/store.ts).
 */
export const isDatabaseEnabled =
  process.env.USE_DATABASE === "true" && !!process.env.DATABASE_URL;

export const db = isDatabaseEnabled
  ? drizzle(neon(process.env.DATABASE_URL!), { schema })
  : null;

export { schema };
