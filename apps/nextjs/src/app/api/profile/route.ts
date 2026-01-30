/**
 * GET /api/profile
 * Fetches the authenticated user's profile including subscription tier
 * 
 * Protected: Requires authentication
 */

import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { withAuthAndErrors } from "~/lib/with-auth";
import { ApiErrors } from "~/lib/api-error";

export const GET = withAuthAndErrors(async (req, { userId }) => {
  try {
    // Query Profile by clerkUserId
    const profile = await db
      .selectFrom("Profile")
      .where("clerkUserId", "=", userId)
      .selectAll()
      .executeTakeFirst();

    if (!profile) {
      throw ApiErrors.notFound("Profile not found");
    }

    // Return profile with subscription tier
    return NextResponse.json({
      id: profile.id,
      clerkUserId: profile.clerkUserId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      subscriptionTier: profile.subscriptionTier,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    // Re-throw ApiErrors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Failed to fetch profile:", error);
    throw ApiErrors.internal("Failed to fetch profile");
  }
});
