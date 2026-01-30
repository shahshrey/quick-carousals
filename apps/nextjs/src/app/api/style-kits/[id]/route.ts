/**
 * Style Kit detail API endpoint
 * GET /api/style-kits/:id - Get style kit by ID
 */

import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { ApiErrors } from "~/lib/api-error";

/**
 * GET /api/style-kits/:id
 * Returns a single style kit by ID
 */
export async function GET(req: Request) {
  try {
    // Extract style kit ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const styleKitId = pathParts[pathParts.length - 1];

    // Fetch style kit
    const styleKit = await db
      .selectFrom("StyleKit")
      .where("id", "=", styleKitId)
      .selectAll()
      .executeTakeFirst();

    if (!styleKit) {
      throw ApiErrors.notFound("Style kit not found");
    }

    return NextResponse.json(styleKit);
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { error: { message: error.message, code: error.code } },
        { status: error.statusCode }
      );
    }
    console.error("Error fetching style kit:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch style kit", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
