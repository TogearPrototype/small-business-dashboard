import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { ensureSchema, runSeed } from "./seed-runner";

/**
 * Seed Neon with the Lumen demo tenant from the CLI:
 *
 *   npm run db:seed
 *
 * Creates the schema if needed, then loads the demo data (idempotent —
 * truncates first). The same logic powers the /api/seed route used to seed a
 * Vercel-provisioned database in place.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed.");
  }
  const db = drizzle(neon(process.env.DATABASE_URL), { schema });
  await ensureSchema(db);
  const summary = await runSeed(db);
  console.log(
    `Seeded: ${summary.tenants} tenant(s), ${summary.services} services, ${summary.staff} staff, ${summary.clients} clients, ${summary.appointments} appointments.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
