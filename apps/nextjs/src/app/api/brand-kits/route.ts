/**
 * Brand Kit API Endpoints
 * 
 * GET /api/brand-kits - List all brand kits for the authenticated user
 * POST /api/brand-kits - Create a new brand kit (with optional logo upload)
 */

import { NextResponse } from "next/server";
import { withAuthAndErrors } from "~/lib/with-auth";
import { validateBody } from "~/lib/validations/api";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { DB as Database } from "@saasfly/db/prisma/types";
import { z } from "zod";
import { uploadFile, getUserFilePath, generateUniqueFilename, STORAGE_BUCKETS } from "~/lib/storage";
import { ApiErrors } from "~/lib/api-error";

// Create database client
const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.POSTGRES_URL,
  }),
});

const db = new Kysely<Database>({ dialect });

/**
 * Validation schema for creating a brand kit
 */
const CreateBrandKitSchema = z.object({
  name: z.string().min(1).max(100),
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
  // Logo will be uploaded separately via multipart/form-data
});

/**
 * GET /api/brand-kits
 * Returns all brand kits for the authenticated user
 */
export const GET = withAuthAndErrors(async (req, { userId }) => {
  // Get user's profile to access their brand kits
  const profile = await db
    .selectFrom("Profile")
    .where("clerkUserId", "=", userId)
    .select("id")
    .executeTakeFirst();

  if (!profile) {
    throw ApiErrors.notFound("User profile");
  }

  // Fetch all brand kits for this user
  const brandKits = await db
    .selectFrom("BrandKit")
    .where("userId", "=", profile.id)
    .selectAll()
    .orderBy("isDefault", "desc") // Default kit first
    .orderBy("createdAt", "desc")
    .execute();

  return NextResponse.json(brandKits);
});

/**
 * POST /api/brand-kits
 * Creates a new brand kit for the authenticated user
 * Supports both JSON and multipart/form-data (for logo upload)
 */
export const POST = withAuthAndErrors(async (req, { userId }) => {
  // Get user's profile
  const profile = await db
    .selectFrom("Profile")
    .where("clerkUserId", "=", userId)
    .select("id")
    .executeTakeFirst();

  if (!profile) {
    throw ApiErrors.notFound("User profile");
  }

  let brandKitData: z.infer<typeof CreateBrandKitSchema>;
  let logoUrl: string | null = null;

  // Check if this is a multipart/form-data request (with logo)
  const contentType = req.headers.get("content-type");
  if (contentType?.includes("multipart/form-data")) {
    // Parse form data
    const formData = await req.formData();
    
    // Extract brand kit data from form fields
    const name = formData.get("name") as string;
    const colorsJson = formData.get("colors") as string;
    const fontsJson = formData.get("fonts") as string;
    const handle = formData.get("handle") as string | null;
    const footerStyle = formData.get("footerStyle") as string | null;
    const isDefault = formData.get("isDefault") === "true";

    // Parse JSON fields
    const colors = colorsJson ? JSON.parse(colorsJson) : undefined;
    const fonts = fontsJson ? JSON.parse(fontsJson) : undefined;

    // Validate data
    brandKitData = CreateBrandKitSchema.parse({
      name,
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

      // Upload logo to storage
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
    brandKitData = await validateBody(req, CreateBrandKitSchema);
  }

  // If setting as default, unset other defaults first
  if (brandKitData.isDefault) {
    await db
      .updateTable("BrandKit")
      .set({ isDefault: false })
      .where("userId", "=", profile.id)
      .execute();
  }

  // Create the brand kit
  const newBrandKit = await db
    .insertInto("BrandKit")
    .values({
      userId: profile.id,
      name: brandKitData.name,
      colors: JSON.stringify(brandKitData.colors || {}),
      fonts: JSON.stringify(brandKitData.fonts || {}),
      logoUrl: logoUrl || null,
      handle: brandKitData.handle || null,
      footerStyle: brandKitData.footerStyle || null,
      isDefault: brandKitData.isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return NextResponse.json(newBrandKit, { status: 201 });
});
