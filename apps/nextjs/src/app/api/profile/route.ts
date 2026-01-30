/**
 * GET /api/profile
 * Fetches the authenticated user's profile including subscription tier
 * 
 * Protected: Requires authentication
 */

import { NextResponse } from "next/server";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { DB as Database } from "@saasfly/db/prisma/types";
import { withAuthAndErrors } from "~/lib/with-auth";
import { ApiErrors } from "~/lib/api-error";

// Create database client
const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.POSTGRES_URL,
  }),
});

const db = new Kysely<Database>({ dialect });

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
