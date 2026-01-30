/**
 * Individual Brand Kit API Endpoints
 * 
 * PATCH /api/brand-kits/:id - Update a brand kit
 * DELETE /api/brand-kits/:id - Delete a brand kit
 */

import { NextResponse } from "next/server";
import { withAuthAndErrors } from "~/lib/with-auth";
import { validateBody } from "~/lib/validations/api";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "@saasfly/db/prisma/types";
import { z } from "zod";
import { uploadFile, getUserFilePath, generateUniqueFilename, deleteFile, STORAGE_BUCKETS } from "~/lib/storage";
import { ApiErrors } from "~/lib/api-error";

// Create database client
const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.POSTGRES_URL,
  }),
});

const db = new Kysely<Database>({ dialect });

/**
 * Validation schema for updating a brand kit
 */
const UpdateBrandKitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  colors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
  }).optional(),
  fonts: z.object({
    headline: z.string().optional(),
    body: z.string().optional(),
  }).optional(),
  handle: z.string().max(100).optional(),
  footerStyle: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
});

/**
 * Helper to verify brand kit ownership
 */
async function verifyBrandKitOwnership(brandKitId: string, userId: string) {
  // Get user's profile
  const profile = await db
    .selectFrom("Profile")
    .where("clerkUserId", "=", userId)
    .select("id")
    .executeTakeFirst();

  if (!profile) {
    throw ApiErrors.notFound("User profile");
  }

  // Check if brand kit exists and belongs to user
  const brandKit = await db
    .selectFrom("BrandKit")
    .where("id", "=", brandKitId)
    .where("userId", "=", profile.id)
    .selectAll()
    .executeTakeFirst();

  if (!brandKit) {
    throw ApiErrors.notFound("Brand kit");
  }

  return { profile, brandKit };
}

/**
 * PATCH /api/brand-kits/:id
 * Updates a brand kit for the authenticated user
 * Supports both JSON and multipart/form-data (for logo upload)
 */
export const PATCH = withAuthAndErrors(async (req, context) => {
  const { userId } = context;
  const params = await (req as any).params;
  const brandKitId = params.id;

  // Verify ownership
  const { profile, brandKit } = await verifyBrandKitOwnership(brandKitId, userId);

  let updateData: z.infer<typeof UpdateBrandKitSchema>;
  let logoUrl: string | undefined = undefined;

  // Check if this is a multipart/form-data request (with logo)
  const contentType = req.headers.get("content-type");
  if (contentType?.includes("multipart/form-data")) {
    // Parse form data
    const formData = await req.formData();
    
    // Extract brand kit data from form fields (all optional for PATCH)
    const name = formData.get("name") as string | null;
    const colorsJson = formData.get("colors") as string | null;
    const fontsJson = formData.get("fonts") as string | null;
    const handle = formData.get("handle") as string | null;
    const footerStyle = formData.get("footerStyle") as string | null;
    const isDefaultStr = formData.get("isDefault") as string | null;

    // Parse JSON fields
    const colors = colorsJson ? JSON.parse(colorsJson) : undefined;
    const fonts = fontsJson ? JSON.parse(fontsJson) : undefined;
    const isDefault = isDefaultStr === "true" ? true : isDefaultStr === "false" ? false : undefined;

    // Validate data
    updateData = UpdateBrandKitSchema.parse({
      name: name || undefined,
      colors,
      fonts,
      handle: handle || undefined,
      footerStyle: footerStyle || undefined,
      isDefault,
    });

    // Handle logo upload if present
    const logoFile = formData.get("logo") as File | null;
    if (logoFile) {
      // Validate file type
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
      if (!allowedTypes.includes(logoFile.type)) {
        throw ApiErrors.validation("Invalid logo file type. Allowed: PNG, JPEG, SVG, WebP");
      }

      // Validate file size (5MB limit for logos bucket)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (logoFile.size > maxSize) {
        throw ApiErrors.validation("Logo file too large. Maximum size: 5MB");
      }

      // Delete old logo if exists
      if (brandKit.logoUrl) {
        try {
          // Extract path from URL (assuming format: https://domain/bucket/path)
          const urlPath = new URL(brandKit.logoUrl).pathname;
          const pathParts = urlPath.split('/').filter(Boolean);
          // Path should be: userId/filename
          if (pathParts.length >= 2) {
            const oldFilePath = `${pathParts[pathParts.length - 2]}/${pathParts[pathParts.length - 1]}`;
            await deleteFile(STORAGE_BUCKETS.LOGOS, oldFilePath);
          }
        } catch (error) {
          console.warn("Failed to delete old logo:", error);
          // Continue anyway - don't fail the update
        }
      }

      // Upload new logo
      const filename = generateUniqueFilename(logoFile.name);
      const filePath = getUserFilePath(profile.id, filename);
      const fileBuffer = Buffer.from(await logoFile.arrayBuffer());

      const uploadResult = await uploadFile(
        STORAGE_BUCKETS.LOGOS,
        filePath,
        fileBuffer,
        logoFile.type
      );

      logoUrl = uploadResult.url;
    }
  } else {
    // Parse JSON body
    updateData = await validateBody(req, UpdateBrandKitSchema);
  }

  // If setting as default, unset other defaults first
  if (updateData.isDefault) {
    await db
      .updateTable("BrandKit")
      .set({ isDefault: false })
      .where("userId", "=", profile.id)
      .where("id", "!=", brandKitId)
      .execute();
  }

  // Build update object (only include fields that were provided)
  const updates: any = {
    updatedAt: new Date(),
  };

  if (updateData.name !== undefined) updates.name = updateData.name;
  if (updateData.colors !== undefined) updates.colors = JSON.stringify(updateData.colors);
  if (updateData.fonts !== undefined) updates.fonts = JSON.stringify(updateData.fonts);
  if (updateData.handle !== undefined) updates.handle = updateData.handle;
  if (updateData.footerStyle !== undefined) updates.footerStyle = updateData.footerStyle;
  if (updateData.isDefault !== undefined) updates.isDefault = updateData.isDefault;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl;

  // Update the brand kit
  const updatedBrandKit = await db
    .updateTable("BrandKit")
    .set(updates)
    .where("id", "=", brandKitId)
    .where("userId", "=", profile.id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return NextResponse.json(updatedBrandKit);
});

/**
 * DELETE /api/brand-kits/:id
 * Deletes a brand kit for the authenticated user
 */
export const DELETE = withAuthAndErrors(async (req, context) => {
  const { userId } = context;
  const params = await (req as any).params;
  const brandKitId = params.id;

  // Verify ownership
  const { profile, brandKit } = await verifyBrandKitOwnership(brandKitId, userId);

  // Delete logo from storage if exists
  if (brandKit.logoUrl) {
    try {
      // Extract path from URL
      const urlPath = new URL(brandKit.logoUrl).pathname;
      const pathParts = urlPath.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        const filePath = `${pathParts[pathParts.length - 2]}/${pathParts[pathParts.length - 1]}`;
        await deleteFile(STORAGE_BUCKETS.LOGOS, filePath);
      }
    } catch (error) {
      console.warn("Failed to delete logo:", error);
      // Continue anyway - we'll delete the database record
    }
  }

  // Delete the brand kit
  await db
    .deleteFrom("BrandKit")
    .where("id", "=", brandKitId)
    .where("userId", "=", profile.id)
    .execute();

  return NextResponse.json({ success: true }, { status: 200 });
});
