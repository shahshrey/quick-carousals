import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { withErrorHandler } from "~/lib/api-error";

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
