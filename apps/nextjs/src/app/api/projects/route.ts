/**
 * Projects API endpoint
 * Protected by withAuth middleware - requires valid Clerk session
 */

import { NextResponse } from "next/server";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { z } from "zod";
import { withAuth } from "~/lib/with-auth";
import { ApiErrors } from "~/lib/api-error";
import { validateBody } from "~/lib/validations/api";
import type { Database } from "@saasfly/db/prisma/types";

// Create Kysely database client
const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.POSTGRES_URL,
    }),
  }),
});

// Validation schema for creating a project
const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  styleKitId: z.string(),
  brandKitId: z.string().optional(),
});

/**
 * GET /api/projects
 * Returns all projects for the authenticated user
 * 
 * @returns 200 - List of user's projects
 * @returns 401 - Not authenticated
 */
export const GET = withAuth(async (req, { userId }) => {
  try {
    // Get Profile ID from clerkUserId
    const profile = await db
      .selectFrom("Profile")
      .where("clerkUserId", "=", userId)
      .select("id")
      .executeTakeFirst();

    if (!profile) {
      throw ApiErrors.notFound("User profile not found");
    }

    // Fetch all projects for this user
    const projects = await db
      .selectFrom("Project")
      .where("userId", "=", profile.id)
      .select([
        "id",
        "title",
        "brandKitId",
        "styleKitId",
        "status",
        "createdAt",
        "updatedAt",
      ])
      .orderBy("updatedAt", "desc")
      .execute();

    return NextResponse.json(projects);
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("Error fetching projects:", error);
    throw ApiErrors.internal("Failed to fetch projects");
  }
});

/**
 * POST /api/projects
 * Creates a new project for the authenticated user
 * 
 * @returns 201 - Created project
 * @returns 400 - Validation error
 * @returns 401 - Not authenticated
 */
export const POST = withAuth(async (req, { userId }) => {
  try {
    // Validate request body
    const body = await validateBody(req, createProjectSchema);

    // Get Profile ID from clerkUserId
    const profile = await db
      .selectFrom("Profile")
      .where("clerkUserId", "=", userId)
      .select("id")
      .executeTakeFirst();

    if (!profile) {
      throw ApiErrors.notFound("User profile not found");
    }

    // Verify styleKit exists
    const styleKit = await db
      .selectFrom("StyleKit")
      .where("id", "=", body.styleKitId)
      .select("id")
      .executeTakeFirst();

    if (!styleKit) {
      throw ApiErrors.validation("Invalid styleKitId");
    }

    // Verify brandKit exists and belongs to user (if provided)
    if (body.brandKitId) {
      const brandKit = await db
        .selectFrom("BrandKit")
        .where("id", "=", body.brandKitId)
        .where("userId", "=", profile.id)
        .select("id")
        .executeTakeFirst();

      if (!brandKit) {
        throw ApiErrors.validation("Invalid brandKitId or brand kit not owned by user");
      }
    }

    // Create project
    const project = await db
      .insertInto("Project")
      .values({
        userId: profile.id,
        title: body.title,
        styleKitId: body.styleKitId,
        brandKitId: body.brandKitId || null,
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("Error creating project:", error);
    throw ApiErrors.internal("Failed to create project");
  }
});
