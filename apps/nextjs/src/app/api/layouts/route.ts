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
 * GET /api/layouts
 * Returns all available template layouts with their blueprints
 * Public endpoint - no authentication required
 */
export const GET = withErrorHandler(async () => {
  // Fetch all template layouts from database
  const layouts = await db
    .selectFrom("TemplateLayout")
    .selectAll()
    .orderBy("id", "asc")
    .execute();

  return NextResponse.json(layouts);
});
