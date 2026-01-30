/**
 * Project slides API endpoint
 * GET /api/projects/:id/slides - Get all slides for a project
 */

import { NextResponse } from "next/server";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { withAuth } from "~/lib/with-auth";
import { ApiErrors } from "~/lib/api-error";
import type { DB as Database } from "@saasfly/db/prisma/types";

// Create Kysely database client
const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.POSTGRES_URL,
    }),
  }),
});

/**
 * GET /api/projects/:id/slides
 * Returns all slides for a project, ordered by orderIndex
 */
export const GET = withAuth(async (req, { userId }) => {
  try {
    // Extract project ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const projectId = pathParts[pathParts.length - 2]; // slides is last, id is second to last

    // Get Profile ID from clerkUserId
    const profile = await db
      .selectFrom("Profile")
      .where("clerkUserId", "=", userId)
      .select("id")
      .executeTakeFirst();

    if (!profile) {
      throw ApiErrors.notFound("User profile not found");
    }

    // Verify project exists and belongs to user
    const project = await db
      .selectFrom("Project")
      .where("id", "=", projectId)
      .where("userId", "=", profile.id)
      .select("id")
      .executeTakeFirst();

    if (!project) {
      throw ApiErrors.notFound("Project not found");
    }

    // Fetch all slides for the project
    const slides = await db
      .selectFrom("Slide")
      .where("projectId", "=", projectId)
      .select([
        "id",
        "projectId",
        "orderIndex",
        "layoutId",
        "slideType",
        "layers",
        "content",
        "createdAt",
        "updatedAt",
      ])
      .orderBy("orderIndex", "asc")
      .execute();

    return NextResponse.json(slides);
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("Error fetching slides:", error);
    throw ApiErrors.internal("Failed to fetch slides");
  }
});
