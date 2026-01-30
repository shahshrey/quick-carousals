/**
 * Export API - Create Export Job
 * 
 * POST /api/exports - Queue a new export job
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@saasfly/db";
import { withAuthAndErrors } from "~/lib/with-auth";
import { validateBody } from "~/lib/validations/api";
import { addRenderJob } from "~/lib/queues/render-queue";
import { ApiErrors } from "~/lib/api-error";

/**
 * Validation schema for creating an export
 */
const CreateExportSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(["PDF", "PNG", "THUMBNAIL"]),
});

/**
 * POST /api/exports
 * Creates a new export job and queues it for processing
 */
export const POST = withAuthAndErrors(async (req, { userId }) => {
  // Validate request body
  const body = await validateBody(req, CreateExportSchema);
  
  // Get user's profile
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
    .where("id", "=", body.projectId)
    .where("userId", "=", profile.id)
    .select(["id", "title"])
    .executeTakeFirst();

  if (!project) {
    throw ApiErrors.notFound("Project not found or access denied");
  }

  // Get all slide IDs for this project
  const slides = await db
    .selectFrom("Slide")
    .where("projectId", "=", body.projectId)
    .select("id")
    .orderBy("orderIndex", "asc")
    .execute();

  if (slides.length === 0) {
    throw ApiErrors.validation("Project has no slides to export");
  }

  // Create export record in database
  const exportRecord = await db
    .insertInto("Export")
    .values({
      projectId: body.projectId,
      exportType: body.type,
      status: "PENDING",
      createdAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // Queue the export job
  await addRenderJob({
    projectId: body.projectId,
    exportId: exportRecord.id,
    exportType: body.type,
    userId: profile.id,
    slideIds: slides.map((s) => s.id),
  });

  // Return export record with ID
  return NextResponse.json({
    id: exportRecord.id,
    projectId: exportRecord.projectId,
    type: exportRecord.exportType,
    status: exportRecord.status,
    createdAt: exportRecord.createdAt,
  }, { status: 201 });
});
