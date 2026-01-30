/**
 * Projects API endpoint
 * Protected by withAuth middleware - requires valid Clerk session
 */

import { NextResponse } from "next/server";
import { withAuth } from "~/lib/with-auth";

/**
 * GET /api/projects
 * Returns all projects for the authenticated user
 * 
 * @returns 200 - List of user's projects
 * @returns 401 - Not authenticated
 */
export const GET = withAuth(async (req, { userId }) => {
  // In a real implementation, this would query the database
  // For now, return a simple response to demonstrate auth works
  
  return NextResponse.json({
    message: "Projects endpoint - authenticated",
    userId,
    projects: [],
  });
});
