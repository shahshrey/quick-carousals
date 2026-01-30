/**
 * Project detail API endpoint
 * GET /api/projects/:id - Get project details
 * PATCH /api/projects/:id - Update project
 * DELETE /api/projects/:id - Delete project
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
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

/**
 * GET /api/projects/:id
 * Returns project details for the authenticated user
 */
export const GET = withAuth(async (req, { userId }) => {
  try {
    // Extract project ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
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

    // Fetch project with ownership check
    const project = await db
      .selectFrom("Project")
      .where("id", "=", projectId)
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
      .executeTakeFirst();

    if (!project) {
      throw ApiErrors.notFound("Project not found");
    }

    return NextResponse.json(project);
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("Error fetching project:", error);
    throw ApiErrors.internal("Failed to fetch project");
  }
});

/**
 * PATCH /api/projects/:id
 * Updates project details
 */
export const PATCH = withAuth(async (req, { userId }) => {
  try {
    // Extract project ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
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
      throw ApiErrors.notFound("Project not found");
    }

    // Build update object
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
 * Deletes a project and all its slides (cascade)
 */
export const DELETE = withAuth(async (req, { userId }) => {
  try {
    // Extract project ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
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

    // Delete project (slides cascade automatically)
    const result = await db
      .deleteFrom("Project")
      .where("id", "=", projectId)
      .where("userId", "=", profile.id)
      .executeTakeFirst();

    if (result.numDeletedRows === BigInt(0)) {
      throw ApiErrors.notFound("Project not found");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("Error deleting project:", error);
    throw ApiErrors.internal("Failed to delete project");
  }
});
