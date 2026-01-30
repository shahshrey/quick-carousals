/**
 * Project [id] API endpoint
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

// Validation schema for updating a project
const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  styleKitId: z.string().optional(),
  brandKitId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

/**
 * PATCH /api/projects/:id
 * Updates a project
 * 
 * @returns 200 - Updated project
 * @returns 400 - Validation error
 * @returns 401 - Not authenticated
 * @returns 404 - Project not found
 */
export const PATCH = withAuth(async (req, { userId }) => {
  try {
    // Get project ID from URL params
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const projectId = pathParts[pathParts.length - 1];

    // Validate request body
    const body = await validateBody(req, updateProjectSchema);

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
    const existingProject = await db
      .selectFrom("Project")
      .where("id", "=", projectId)
      .where("userId", "=", profile.id)
      .select("id")
      .executeTakeFirst();

    if (!existingProject) {
      throw ApiErrors.notFound("Project not found or not owned by user");
    }

    // Verify styleKit exists (if being updated)
    if (body.styleKitId) {
      const styleKit = await db
        .selectFrom("StyleKit")
        .where("id", "=", body.styleKitId)
        .select("id")
        .executeTakeFirst();

      if (!styleKit) {
        throw ApiErrors.validation("Invalid styleKitId");
      }
    }

    // Verify brandKit exists and belongs to user (if being updated)
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

    // Build update object (only include provided fields)
    const updates: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updates.title = body.title;
    if (body.styleKitId !== undefined) updates.styleKitId = body.styleKitId;
    if (body.brandKitId !== undefined) updates.brandKitId = body.brandKitId;
    if (body.status !== undefined) updates.status = body.status;

    // Update project
    const project = await db
      .updateTable("Project")
      .set(updates)
      .where("id", "=", projectId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return NextResponse.json(project);
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("Error updating project:", error);
    throw ApiErrors.internal("Failed to update project");
  }
});

/**
 * DELETE /api/projects/:id
 * Deletes a project and all associated slides
 * 
 * @returns 204 - Project deleted successfully
 * @returns 401 - Not authenticated
 * @returns 404 - Project not found
 */
export const DELETE = withAuth(async (req, { userId }) => {
  try {
    // Get project ID from URL params
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const projectId = pathParts[pathParts.length - 1];

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
    const existingProject = await db
      .selectFrom("Project")
      .where("id", "=", projectId)
      .where("userId", "=", profile.id)
      .select("id")
      .executeTakeFirst();

    if (!existingProject) {
      throw ApiErrors.notFound("Project not found or not owned by user");
    }

    // Delete project (cascade will delete slides and exports)
    await db
      .deleteFrom("Project")
      .where("id", "=", projectId)
      .execute();

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("Error deleting project:", error);
    throw ApiErrors.internal("Failed to delete project");
  }
});
