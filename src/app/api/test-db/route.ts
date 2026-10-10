import { NextResponse } from "next/server";
import { Client } from "pg";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  const masked = dbUrl ? dbUrl.replace(/:([^@]+)@/, ":***@") : "NOT_SET";

  if (!dbUrl) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL not set", dbUrl: "NOT_SET" }, { status: 500 });
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query("SELECT 1 as ok, now() as time");
    await client.end();
    return NextResponse.json({
      ok: true,
      dbUrl: masked,
      authSecret: process.env.AUTH_SECRET ? "SET" : "NOT_SET",
      pgVersion: result.rows[0],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await client.end().catch(() => {});
    return NextResponse.json({ ok: false, error: msg, dbUrl: masked }, { status: 500 });
  }
}
