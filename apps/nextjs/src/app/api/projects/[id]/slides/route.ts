/**
 * Project slides API endpoint
 * GET /api/projects/:id/slides - Get all slides for a project
 * PUT /api/projects/:id/slides - Update all slides for a project
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@saasfly/db";
import { withAuthAndErrors } from "~/lib/with-auth";
import { ApiErrors } from "~/lib/api-error";
import { validateBody } from "~/lib/validations/api";

// Validation schema for updating slides
const updateSlidesSchema = z.object({
  slides: z.array(z.object({
    id: z.string(),
    layoutId: z.string(),
    slideType: z.string().optional(),
    orderIndex: z.number().optional(),
    content: z.record(z.any()),
    layers: z.any().optional(),
  })),
});

/**
 * GET /api/projects/:id/slides
 * Returns all slides for a project, ordered by orderIndex
 */
export const GET = withAuthAndErrors(async (req, { userId }) => {
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

/**
 * PUT /api/projects/:id/slides
 * Updates all slides for a project in bulk
 */
export const PUT = withAuthAndErrors(async (req, { userId }) => {
  try {
    // Extract project ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const projectId = pathParts[pathParts.length - 2];

    // Validate request body
    const body = await validateBody(req, updateSlidesSchema);

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

    // Update each slide
    const updatePromises = body.slides.map(async (slide, index) => {
      // Don't update slides with temp IDs (will be created separately)
      if (slide.id.startsWith('temp-')) {
        return null;
      }

      return db
        .updateTable("Slide")
        .set({
          layoutId: slide.layoutId,
          slideType: slide.slideType || '',
          orderIndex: slide.orderIndex !== undefined ? slide.orderIndex : index,
          content: JSON.stringify(slide.content) as any,
          layers: slide.layers ? JSON.stringify(slide.layers) : JSON.stringify([]) as any,
          updatedAt: new Date(),
        })
        .where("id", "=", slide.id)
        .where("projectId", "=", projectId)
        .execute();
    });

    await Promise.all(updatePromises);

    // Fetch updated slides
    const updatedSlides = await db
      .selectFrom("Slide")
      .where("projectId", "=", projectId)
      .selectAll()
      .orderBy("orderIndex", "asc")
      .execute();

    return NextResponse.json({ success: true, slides: updatedSlides });
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("Error updating slides:", error);
    throw ApiErrors.internal("Failed to update slides");
  }
});
