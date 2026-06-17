import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Neon connection. The app uses the database whenever a DATABASE_URL is
 * present — which the Vercel↔Neon integration injects automatically in every
 * deployment — so prod "just works" with no extra flag. Set USE_DATABASE=false
 * to force the in-memory fallback even when a DATABASE_URL exists (handy for
 * local dev without a live DB).
 */
export const isDatabaseEnabled =
  process.env.USE_DATABASE !== "false" && !!process.env.DATABASE_URL;

export const db = isDatabaseEnabled
  ? drizzle(neon(process.env.DATABASE_URL!), { schema })
  : null;

export { schema };
