import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { withErrorHandler } from "~/lib/api-error";

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
