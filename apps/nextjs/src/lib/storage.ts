/**
 * Storage Utility for QuickCarousals
 * 
 * Provides utilities for uploading, downloading, and managing files in Supabase Storage.
 * Two buckets are configured:
 * - 'logos': For brand kit logos (5MB limit, images only)
 * - 'exports': For carousel exports (50MB limit, PDFs and PNGs)
 */

import { createServerClient, createBrowserClient } from './supabase';

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  LOGOS: 'logos',
  EXPORTS: 'exports',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

/**
 * Upload a file to storage
 * 
 * @param bucket - Storage bucket name ('logos' or 'exports')
 * @param path - File path within the bucket (e.g., 'userId/filename.png')
 * @param file - File buffer or Blob to upload
 * @param contentType - MIME type of the file
 * @returns Object with path and public URL
 */
export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: Buffer | Blob,
  contentType: string
): Promise<{ path: string; url: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true, // Replace if exists
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL (will require signed URL for private buckets)
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

/**
 * Generate a signed URL for downloading a private file
 * 
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param expiresIn - Expiration time in seconds (default: 24 hours)
 * @returns Signed URL that expires after the specified time
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 86400 // 24 hours
): Promise<string> {
  const supabase = createServerClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Delete a file from storage
 * 
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * List files in a user's folder
 * 
 * @param bucket - Storage bucket name
 * @param userId - User ID (folder name)
 * @returns Array of file metadata
 */
export async function listUserFiles(
  bucket: StorageBucket,
  userId: string
): Promise<Array<{ name: string; size: number; createdAt: string }>> {
  const supabase = createServerClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(userId, {
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data.map((file) => ({
    name: file.name,
    size: file.metadata?.size || 0,
    createdAt: file.created_at,
  }));
}

/**
 * Client-side upload helper (for browser uploads)
 * 
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param file - File object from file input
 * @returns Object with path and public URL
 */
export async function uploadFileFromBrowser(
  bucket: StorageBucket,
  path: string,
  file: File
): Promise<{ path: string; url: string }> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

/**
 * Helper to generate storage path for user files
 * 
 * @param userId - User ID
 * @param filename - File name
 * @returns Full path (e.g., 'userId/filename.png')
 */
export function getUserFilePath(userId: string, filename: string): string {
  return `${userId}/${filename}`;
}

/**
 * Helper to generate unique filename
 * 
 * @param originalName - Original file name
 * @returns Unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '-');
  return `${sanitizedName}-${timestamp}.${extension}`;
}
