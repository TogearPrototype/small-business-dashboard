import { NextResponse } from "next/server";
import { db, isDatabaseEnabled } from "@/lib/db";
import { ensureSchema, runSeed } from "@/lib/db/seed-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One-time seed endpoint — creates the schema and loads the demo tenant into
 * whatever database DATABASE_URL points at (i.e. the Vercel-provisioned Neon
 * DB, where this runs with the correct injected credentials).
 *
 * Guard: requires a matching token. Set SEED_SECRET in the environment and call
 *
 *   POST /api/seed?secret=<SEED_SECRET>
 *   (or send header  x-seed-secret: <SEED_SECRET>)
 *
 * If SEED_SECRET is unset, the route refuses to run (so it can't be abused).
 * Safe to call more than once — runSeed truncates first.
 */
async function handle(req: Request): Promise<NextResponse> {
  if (!isDatabaseEnabled || !db) {
    return NextResponse.json(
      { ok: false, error: "Database not enabled (no DATABASE_URL)." },
      { status: 400 },
    );
  }

  const expected = process.env.SEED_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "SEED_SECRET is not set; refusing to seed." },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const provided = url.searchParams.get("secret") ?? req.headers.get("x-seed-secret");
  if (provided !== expected) {
    return NextResponse.json({ ok: false, error: "Bad secret." }, { status: 401 });
  }

  try {
    await ensureSchema(db);
    const summary = await runSeed(db);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return handle(req);
}

// GET allowed too, so you can trigger it from a browser address bar once.
export async function GET(req: Request) {
  return handle(req);
}
