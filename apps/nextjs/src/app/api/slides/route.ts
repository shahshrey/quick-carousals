/**
 * Slides API endpoint
 * Protected by withAuthAndErrors middleware - requires valid Clerk session
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@saasfly/db";
import { withAuthAndErrors } from "~/lib/with-auth";
import { ApiErrors } from "~/lib/api-error";
import { validateBody } from "~/lib/validations/api";

// Validation schema for creating a slide
const createSlideSchema = z.object({
  projectId: z.string(),
  orderIndex: z.number().int().min(0),
  layoutId: z.string(),
  slideType: z.string(),
  content: z.object({
    headline: z.string(),
    body: z.array(z.string()).optional(),
    emphasis: z.array(z.string()).optional(),
  }),
});

/**
 * POST /api/slides
 * Creates a new slide for a project
 * 
 * @returns 201 - Created slide
 * @returns 400 - Validation error
 * @returns 401 - Not authenticated
 * @returns 403 - Project not owned by user
 */
export const POST = withAuthAndErrors(async (req, { userId }) => {
  try {
    // Validate request body
    const body = await validateBody(req, createSlideSchema);

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
      .where("id", "=", body.projectId)
      .where("userId", "=", profile.id)
      .select("id")
      .executeTakeFirst();

    if (!project) {
      throw ApiErrors.forbidden("Project not found or not owned by user");
    }

    // Verify layout exists
    const layout = await db
      .selectFrom("TemplateLayout")
      .where("id", "=", body.layoutId)
      .select("id")
      .executeTakeFirst();

    if (!layout) {
      throw ApiErrors.validation("Invalid layoutId");
    }

    // Create slide
    const slide = await db
      .insertInto("Slide")
      .values({
        projectId: body.projectId,
        orderIndex: body.orderIndex,
        layoutId: body.layoutId,
        slideType: body.slideType,
        content: JSON.stringify(body.content),
        layers: JSON.stringify([]), // Empty layers for now, will be populated by editor
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return NextResponse.json(slide, { status: 201 });
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("Error creating slide:", error);
    throw ApiErrors.internal("Failed to create slide");
  }
});
