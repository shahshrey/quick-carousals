/**
 * Export API - Get Export Status
 * 
 * GET /api/exports/[id] - Poll export job status and get download URL when complete
 */

import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { withAuthAndErrors } from "~/lib/with-auth";
import { ApiErrors } from "~/lib/api-error";
import { getSignedUrl, STORAGE_BUCKETS } from "~/lib/storage";

/**
 * GET /api/exports/[id]
 * Returns the status of an export job and signed download URL if complete
 */
export const GET = withAuthAndErrors(async (req, { userId }) => {
  // Extract export ID from URL
  const url = new URL(req.url);
  const exportId = url.pathname.split('/').pop();

  if (!exportId) {
    throw ApiErrors.validation("Export ID is required");
  }

  // Get user's profile
  const profile = await db
    .selectFrom("Profile")
    .where("clerkUserId", "=", userId)
    .select("id")
    .executeTakeFirst();

  if (!profile) {
    throw ApiErrors.notFound("User profile not found");
  }

  // Fetch export record with project ownership check
  const exportRecord = await db
    .selectFrom("Export")
    .innerJoin("Project", "Export.projectId", "Project.id")
    .where("Export.id", "=", exportId)
    .where("Project.userId", "=", profile.id)
    .select([
      "Export.id",
      "Export.projectId",
      "Export.exportType",
      "Export.status",
      "Export.fileUrl",
      "Export.errorMessage",
      "Export.createdAt",
      "Export.completedAt",
    ])
    .executeTakeFirst();

  if (!exportRecord) {
    throw ApiErrors.notFound("Export not found or access denied");
  }

  // Build response object
  const response: {
    id: string;
    projectId: string;
    type: string;
    status: string;
    createdAt: Date;
    completedAt?: Date | null;
    fileUrl?: string | string[];
    errorMessage?: string | null;
  } = {
    id: exportRecord.id,
    projectId: exportRecord.projectId,
    type: exportRecord.exportType,
    status: exportRecord.status,
    createdAt: exportRecord.createdAt,
    completedAt: exportRecord.completedAt,
  };

  // If completed, generate signed URLs for download
  if (exportRecord.status === "COMPLETED" && exportRecord.fileUrl) {
    try {
      // For PNG exports, fileUrl is a JSON array of paths
      if (exportRecord.exportType === "PNG") {
        const paths = JSON.parse(exportRecord.fileUrl as string);
        if (Array.isArray(paths)) {
          // Generate signed URL for each PNG
          const signedUrls = await Promise.all(
            paths.map((path: string) => getSignedUrl(STORAGE_BUCKETS.EXPORTS, path))
          );
          response.fileUrl = signedUrls;
        } else {
          // Single path (shouldn't happen for PNG, but handle gracefully)
          response.fileUrl = await getSignedUrl(STORAGE_BUCKETS.EXPORTS, paths);
        }
      } else {
        // For PDF and THUMBNAIL, fileUrl is a single path
        response.fileUrl = await getSignedUrl(STORAGE_BUCKETS.EXPORTS, exportRecord.fileUrl);
      }
    } catch (error) {
      console.error("Failed to generate signed URL:", error);
      // Don't fail the request - just omit the URL and let client retry
      response.errorMessage = "Failed to generate download URL. Please try again.";
    }
  }

  // If failed, include error message
  if (exportRecord.status === "FAILED") {
    response.errorMessage = exportRecord.errorMessage;
  }

  return NextResponse.json(response);
});
