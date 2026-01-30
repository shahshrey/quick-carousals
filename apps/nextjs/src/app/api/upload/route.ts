/**
 * File Upload API Endpoint
 * 
 * POST /api/upload
 * Accepts file uploads to Supabase Storage and returns a signed URL
 * 
 * Authentication: Required (Clerk)
 * Body (form-data):
 * - bucket: 'logos' | 'exports'
 * - file: File to upload
 * - filename: Optional custom filename
 */

import { NextResponse } from "next/server";
import { withAuth } from "~/lib/with-auth";
import { ApiErrors } from "~/lib/api-error";
import {
  uploadFile,
  getSignedUrl,
  getUserFilePath,
  generateUniqueFilename,
  STORAGE_BUCKETS,
  type StorageBucket,
} from "~/lib/storage";

// Maximum file sizes per bucket
const MAX_FILE_SIZES = {
  logos: 5 * 1024 * 1024, // 5MB
  exports: 50 * 1024 * 1024, // 50MB
} as const;

// Allowed MIME types per bucket
const ALLOWED_MIME_TYPES = {
  logos: ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"],
  exports: ["application/pdf", "image/png"],
} as const;

export const POST = withAuth(async (req, { userId }) => {
  try {
    // Parse form data
    const formData = await req.formData();
    const bucket = formData.get("bucket") as string;
    const file = formData.get("file") as File;
    const customFilename = formData.get("filename") as string | null;

    // Validate bucket
    if (!bucket || !Object.values(STORAGE_BUCKETS).includes(bucket as StorageBucket)) {
      return ApiErrors.validation(
        `Invalid bucket. Must be one of: ${Object.values(STORAGE_BUCKETS).join(", ")}`
      ).toResponse();
    }

    // Validate file
    if (!file || !(file instanceof File)) {
      return ApiErrors.validation("File is required").toResponse();
    }

    // Check file size
    const maxSize = MAX_FILE_SIZES[bucket as keyof typeof MAX_FILE_SIZES];
    if (file.size > maxSize) {
      return ApiErrors.validation(
        `File size exceeds maximum of ${maxSize / 1024 / 1024}MB for ${bucket} bucket`
      ).toResponse();
    }

    // Check MIME type
    const allowedTypes = ALLOWED_MIME_TYPES[bucket as keyof typeof ALLOWED_MIME_TYPES];
    if (!allowedTypes.includes(file.type)) {
      return ApiErrors.validation(
        `Invalid file type. Allowed types for ${bucket}: ${allowedTypes.join(", ")}`
      ).toResponse();
    }

    // Generate filename
    const filename = customFilename || generateUniqueFilename(file.name);
    const filePath = getUserFilePath(userId, filename);

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to storage
    const { path } = await uploadFile(
      bucket as StorageBucket,
      filePath,
      buffer,
      file.type
    );

    // Generate signed URL (24hr expiry by default)
    const signedUrl = await getSignedUrl(bucket as StorageBucket, path);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          path,
          url: signedUrl,
          bucket,
          filename,
          size: file.size,
          contentType: file.type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);

    // Handle known errors
    if (error instanceof Error) {
      return ApiErrors.internal(error.message).toResponse();
    }

    // Handle unexpected errors
    return ApiErrors.internal("Failed to upload file").toResponse();
  }
});
