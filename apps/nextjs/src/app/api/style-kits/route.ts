import { NextResponse } from "next/server";
import { withErrorHandler } from "~/lib/api-error";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { DB as Database } from "@saasfly/db/prisma/types";

// Create database client
const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.POSTGRES_URL,
  }),
});

const db = new Kysely<Database>({ dialect });

/**
 * GET /api/style-kits
 * Returns all available style kits for the selector UI
 * Public endpoint - no authentication required
 */
export const GET = withErrorHandler(async () => {
  // Fetch all style kits from database
  const styleKits = await db
    .selectFrom("StyleKit")
    .selectAll()
    .orderBy("isPremium", "asc") // Free kits first
    .orderBy("id", "asc")
    .execute();

  return NextResponse.json(styleKits);
});
