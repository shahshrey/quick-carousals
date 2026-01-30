# API Error Handling, Authentication, Validation, Storage & Caching

This directory contains utilities for consistent error handling, authentication, request validation, file storage, and caching across all API routes.

## Authentication

### Protected API Routes

Use `withAuth` to protect endpoints that require authentication:

```typescript
import { withAuth } from "~/lib/with-auth";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, { userId }) => {
  // userId is guaranteed to exist and is extracted from Clerk session
  
  const projects = await db.selectFrom("Project")
    .where("userId", "=", userId)
    .selectAll()
    .execute();

  return NextResponse.json({ projects });
});
```

### withAuth Behavior

- Returns **401 Unauthorized** if no valid Clerk session is found
- Extracts `userId` from Clerk session and passes it to your handler
- Handles auth errors gracefully with consistent error responses

### Combined Auth + Error Handling

Use `withAuthAndErrors` for endpoints that need both authentication and error handling:

```typescript
import { withAuthAndErrors } from "~/lib/with-auth";
import { ApiErrors } from "~/lib/api-error";
import { NextResponse } from "next/server";

export const DELETE = withAuthAndErrors(async (req, { userId }) => {
  const projectId = new URL(req.url).searchParams.get("id");
  
  if (!projectId) {
    throw ApiErrors.validation("Project ID is required");
  }

  // Verify ownership
  const project = await db.selectFrom("Project")
    .where("id", "=", projectId)
    .where("userId", "=", userId)
    .selectAll()
    .executeTakeFirst();

  if (!project) {
    throw ApiErrors.notFound("Project");
  }

  // Delete project...
  
  return NextResponse.json({ success: true });
});
```

### Testing Protected Endpoints

```bash
# Without authentication - should return 401
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/projects
# Output: 401

# With authentication (requires valid Clerk session cookie)
curl -s http://localhost:3000/api/projects \
  -H "Cookie: __session=<clerk-session-token>"
# Output: { "projects": [...] }
```

## Error Handling

### Basic Usage

```typescript
import { ApiError, ApiErrors, withErrorHandler } from "~/lib/api-error";
import { NextResponse } from "next/server";

// Using pre-defined error types
export const GET = withErrorHandler(async (req) => {
  // Throw validation error
  if (!someCondition) {
    throw ApiErrors.validation("Invalid input", { field: "example" });
  }

  // Throw unauthorized error
  if (!isAuthenticated) {
    throw ApiErrors.unauthorized();
  }

  // Throw not found error
  if (!resource) {
    throw ApiErrors.notFound("Project");
  }

  // Success response
  return NextResponse.json({ data: "success" });
});
```

### Custom ApiError

```typescript
import { ApiError } from "~/lib/api-error";

// Create custom error
throw new ApiError(
  "CUSTOM_ERROR_CODE",
  "Custom error message",
  400, // Status code
  { additional: "details" } // Optional details
);
```

### Error Response Format

All errors follow this consistent shape:

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "issues": [
        { "path": "email", "message": "Invalid email format" }
      ]
    },
    "requestId": "abc123" // Optional
  }
}
```

### Available Error Factories

- `ApiErrors.validation(message, details?)` - 400 Bad Request
- `ApiErrors.unauthorized(message?)` - 401 Unauthorized
- `ApiErrors.forbidden(message?)` - 403 Forbidden
- `ApiErrors.notFound(resource?)` - 404 Not Found
- `ApiErrors.rateLimited(retryAfter?)` - 429 Too Many Requests
- `ApiErrors.internal(message?)` - 500 Internal Server Error

## Request Validation

### Validating Request Body

```typescript
import { validateBody } from "~/lib/validations/api";
import { z } from "zod";

const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  styleKitId: z.string(),
});

export const POST = withErrorHandler(async (req) => {
  // This will throw ApiError if validation fails
  const data = await validateBody(req, createProjectSchema);

  // data is now type-safe
  return NextResponse.json({ project: data });
});
```

### Validating Query Parameters

```typescript
import { validateSearchParams } from "~/lib/validations/api";
import { z } from "zod";

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const { page, limit } = validateSearchParams(searchParams, querySchema);

  // page and limit are now type-safe numbers
  return NextResponse.json({ page, limit });
});
```

### Validating Path Parameters

```typescript
import { validateParams } from "~/lib/validations/api";
import { z } from "zod";

const paramsSchema = z.object({
  projectId: z.string().uuid(),
});

export const GET = withErrorHandler(async (
  req: Request,
  { params }: { params: Record<string, string> }
) => {
  const { projectId } = validateParams(params, paramsSchema);

  // projectId is validated as UUID
  return NextResponse.json({ projectId });
});
```

### Generic Validation

```typescript
import { validate } from "~/lib/validations/api";
import { z } from "zod";

const dataSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Validate any data (e.g., database results)
const validatedData = validate(
  dbResult,
  dataSchema,
  "Invalid data from database"
);
```

## Complete Example

```typescript
// app/api/projects/[projectId]/route.ts
import { NextResponse } from "next/server";
import { withErrorHandler, ApiErrors } from "~/lib/api-error";
import { validateParams, validateBody } from "~/lib/validations/api";
import { z } from "zod";

const paramsSchema = z.object({
  projectId: z.string().uuid(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const GET = withErrorHandler(async (
  req: Request,
  { params }: { params: Record<string, string> }
) => {
  const { projectId } = validateParams(params, paramsSchema);

  const project = await db.selectFrom("Project")
    .where("id", "=", projectId)
    .selectAll()
    .executeTakeFirst();

  if (!project) {
    throw ApiErrors.notFound("Project");
  }

  return NextResponse.json({ project });
});

export const PATCH = withErrorHandler(async (
  req: Request,
  { params }: { params: Record<string, string> }
) => {
  const { projectId } = validateParams(params, paramsSchema);
  const updates = await validateBody(req, updateSchema);

  // Update project...
  
  return NextResponse.json({ project: updated });
});
```

## Testing Error Responses

```bash
# Test validation error
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Expected response (400):
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "issues": [
        { "path": "title", "message": "Required" }
      ]
    }
  }
}
```

## File Storage

### Storage Buckets

QuickCarousals uses Supabase Storage with two configured buckets:

- **`logos`**: Brand kit logos (5MB limit, images only)
- **`exports`**: Carousel exports (50MB limit, PDFs and PNGs)

Both buckets are private and require authentication.

### Server-Side Upload

Use for API routes and server actions:

```typescript
import { uploadFile, STORAGE_BUCKETS, getUserFilePath, generateUniqueFilename } from "~/lib/storage";

export const POST = withAuth(async (req, { userId }) => {
  const formData = await req.formData();
  const file = formData.get("logo") as File;
  
  if (!file) {
    throw ApiErrors.validation("Logo file is required");
  }
  
  // Convert File to Buffer
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Generate unique filename
  const filename = generateUniqueFilename(file.name);
  const path = getUserFilePath(userId, filename);
  
  // Upload to logos bucket
  const { path: uploadedPath, url } = await uploadFile(
    STORAGE_BUCKETS.LOGOS,
    path,
    buffer,
    file.type
  );
  
  return NextResponse.json({ logoUrl: url });
});
```

### Client-Side Upload

Use for browser file uploads:

```typescript
import { uploadFileFromBrowser, STORAGE_BUCKETS, getUserFilePath, generateUniqueFilename } from "~/lib/storage";

async function handleLogoUpload(file: File, userId: string) {
  const filename = generateUniqueFilename(file.name);
  const path = getUserFilePath(userId, filename);
  
  const { path: uploadedPath, url } = await uploadFileFromBrowser(
    STORAGE_BUCKETS.LOGOS,
    path,
    file
  );
  
  console.log("Uploaded to:", uploadedPath);
  console.log("URL:", url);
}
```

### Generating Signed URLs

For private files, generate temporary signed URLs:

```typescript
import { getSignedUrl, STORAGE_BUCKETS } from "~/lib/storage";

export const GET = withAuth(async (req, { userId }) => {
  const exportId = new URL(req.url).searchParams.get("exportId");
  
  // Get export from database
  const exportRecord = await db.selectFrom("Export")
    .where("id", "=", exportId)
    .where("userId", "=", userId) // Verify ownership
    .selectAll()
    .executeTakeFirst();
  
  if (!exportRecord || !exportRecord.fileUrl) {
    throw ApiErrors.notFound("Export");
  }
  
  // Extract path from fileUrl
  const path = exportRecord.fileUrl.split("/storage/v1/object/public/exports/")[1];
  
  // Generate signed URL (expires in 24 hours)
  const signedUrl = await getSignedUrl(STORAGE_BUCKETS.EXPORTS, path, 86400);
  
  return NextResponse.json({ downloadUrl: signedUrl });
});
```

### Deleting Files

```typescript
import { deleteFile, STORAGE_BUCKETS } from "~/lib/storage";

export const DELETE = withAuth(async (req, { userId }) => {
  const logoPath = `${userId}/logo-123456.png`;
  
  await deleteFile(STORAGE_BUCKETS.LOGOS, logoPath);
  
  return NextResponse.json({ success: true });
});
```

### Listing User Files

```typescript
import { listUserFiles, STORAGE_BUCKETS } from "~/lib/storage";

export const GET = withAuth(async (req, { userId }) => {
  const files = await listUserFiles(STORAGE_BUCKETS.EXPORTS, userId);
  
  return NextResponse.json({ files });
});
```

### Storage Path Helpers

```typescript
import { getUserFilePath, generateUniqueFilename } from "~/lib/storage";

// Generate user-specific path
const path = getUserFilePath("user-123", "logo.png");
// Returns: "user-123/logo.png"

// Generate unique filename with timestamp
const filename = generateUniqueFilename("carousel.pdf");
// Returns: "carousel-1706399999123.pdf"
```

### Storage Buckets Configuration

Buckets are configured in `supabase/create_buckets.sql` with:

- File size limits
- Allowed MIME types
- Row Level Security (RLS) policies
- User-scoped access (users can only access their own files)

### Environment Variables

Storage requires the following environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Redis Caching

### Redis Client Singleton

QuickCarousals uses Upstash Redis for:
- Caching (API responses, database queries)
- Session storage
- Job queue backend (BullMQ for exports)

The Redis client is implemented as a singleton to ensure efficient connection reuse.

### Basic Usage

```typescript
import { getRedisClient } from "~/lib/redis";

// Get the Redis client
const redis = getRedisClient();

// Set a value
await redis.set("key", "value");

// Get a value
const value = await redis.get<string>("key");

// Set with expiration (in seconds)
await redis.set("cache:projects", projectsData, { ex: 3600 });

// Delete a key
await redis.del("key");

// Increment a counter
await redis.incr("counter:api-calls");
```

### Caching API Responses

```typescript
import { getRedisClient } from "~/lib/redis";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, { userId }) => {
  const redis = getRedisClient();
  const cacheKey = `projects:${userId}`;

  // Try to get from cache
  const cached = await redis.get<Project[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ projects: cached, cached: true });
  }

  // Fetch from database
  const projects = await db.selectFrom("Project")
    .where("userId", "=", userId)
    .selectAll()
    .execute();

  // Store in cache for 1 hour
  await redis.set(cacheKey, projects, { ex: 3600 });

  return NextResponse.json({ projects, cached: false });
});
```

### Cache Invalidation

```typescript
import { getRedisClient } from "~/lib/redis";

export const POST = withAuth(async (req, { userId }) => {
  const redis = getRedisClient();

  // Create new project
  const project = await createProject(data);

  // Invalidate user's projects cache
  await redis.del(`projects:${userId}`);

  return NextResponse.json({ project });
});
```

### Hash Operations

```typescript
import { getRedisClient } from "~/lib/redis";

const redis = getRedisClient();

// Store user session data
await redis.hset("session:abc123", {
  userId: "user-123",
  email: "user@example.com",
  lastActivity: Date.now(),
});

// Get session data
const session = await redis.hgetall<SessionData>("session:abc123");

// Update specific field
await redis.hset("session:abc123", { lastActivity: Date.now() });

// Delete session
await redis.del("session:abc123");
```

### List Operations (Queues)

```typescript
import { getRedisClient } from "~/lib/redis";

const redis = getRedisClient();

// Add job to queue (left push)
await redis.lpush("export-queue", JSON.stringify({ projectId: "123", type: "PDF" }));

// Process job (right pop)
const job = await redis.rpop<string>("export-queue");
if (job) {
  const { projectId, type } = JSON.parse(job);
  // Process export...
}

// Get queue length
const queueLength = await redis.llen("export-queue");
```

### Rate Limiting

```typescript
import { getRedisClient } from "~/lib/redis";
import { ApiErrors } from "~/lib/api-error";

export const POST = withAuth(async (req, { userId }) => {
  const redis = getRedisClient();
  const rateLimitKey = `rate-limit:${userId}:generate`;

  // Increment request count
  const count = await redis.incr(rateLimitKey);

  // Set expiry on first request (1 hour window)
  if (count === 1) {
    await redis.expire(rateLimitKey, 3600);
  }

  // Check limit (e.g., 30 requests per hour for Creator tier)
  if (count > 30) {
    const ttl = await redis.ttl(rateLimitKey);
    throw ApiErrors.rateLimited(ttl);
  }

  // Process request...
  return NextResponse.json({ success: true });
});
```

### Testing Redis Connection

```typescript
import { testRedisConnection, getRedisConnectionInfo } from "~/lib/redis";

// Test connection (useful for health checks)
try {
  await testRedisConnection();
  console.log("Redis is healthy");
} catch (error) {
  console.error("Redis connection failed:", error);
}

// Get connection info for debugging
const info = getRedisConnectionInfo();
console.log("Redis configured:", info.configured);
console.log("Redis URL:", info.url);
```

### Environment Variables

Redis requires the following environment variables:

```bash
# Upstash Redis (recommended)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-rest-token"

# Alternative: Standard Redis URL
# REDIS_URL="redis://localhost:6379"
```

### Error Handling

The Redis client automatically:
- Retries failed requests (up to 3 times)
- Uses exponential backoff (up to 10 seconds)
- Throws descriptive errors if configuration is missing

```typescript
import { getRedisClient } from "~/lib/redis";

try {
  const redis = getRedisClient();
  await redis.set("key", "value");
} catch (error) {
  // Handle error (e.g., configuration missing, connection failed)
  console.error("Redis operation failed:", error);
}
```

### Best Practices

1. **Use expiration times**: Always set expiration for cached data to prevent stale data
2. **Namespace keys**: Use prefixes to organize keys (e.g., `cache:`, `session:`, `rate-limit:`)
3. **Handle cache misses**: Always have fallback logic to fetch from primary data source
4. **Invalidate strategically**: Clear cache when underlying data changes
5. **Monitor usage**: Track cache hit rates and adjust TTLs accordingly

## Background Job Queue (BullMQ)

### Overview

QuickCarousals uses BullMQ with Redis for background job processing. The primary use case is rendering and exporting carousel PDFs/PNGs, which can take 10-30 seconds and should not block API responses.

### Render Queue

The render queue handles all export jobs (PDF, PNG, thumbnail generation).

### Adding Jobs to Queue

```typescript
import { addRenderJob, RenderJobData } from "~/lib/queues/render-queue";

export const POST = withAuth(async (req, { userId }) => {
  // Create export record in database
  const exportRecord = await db.insertInto("Export")
    .values({
      projectId: projectId,
      exportType: "PDF",
      status: "PENDING",
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // Add job to queue
  const jobId = await addRenderJob({
    projectId: projectId,
    exportId: exportRecord.id,
    exportType: "PDF",
    userId: userId,
    slideIds: ["slide-1", "slide-2", "slide-3"],
  });

  return NextResponse.json({
    exportId: exportRecord.id,
    jobId: jobId,
    status: "PENDING",
  });
});
```

### Job Priority

Higher priority for Pro tier users:

```typescript
import { addRenderJob } from "~/lib/queues/render-queue";

// Free tier users: priority 10 (default)
await addRenderJob(jobData);

// Pro tier users: priority 1 (higher priority)
await addRenderJob(jobData, 1);
```

### Checking Queue Status

```typescript
import { getQueueStats } from "~/lib/queues/render-queue";

// Get queue statistics
const stats = await getQueueStats();
console.log(stats);
// {
//   waiting: 5,    // Jobs waiting to be processed
//   active: 2,     // Jobs currently being processed
//   completed: 100, // Successfully completed jobs
//   failed: 1      // Failed jobs
// }
```

### Checking Job Status

```typescript
import { getJobStatus } from "~/lib/queues/render-queue";

// Get status by job ID (same as exportId)
const status = await getJobStatus(exportId);
if (status) {
  console.log(status.state); // 'waiting', 'active', 'completed', 'failed'
  console.log(status.progress); // Progress percentage (0-100)
  console.log(status.failedReason); // Error message if failed
}
```

### Queue Configuration

The render queue is configured with:
- **3 retry attempts** with exponential backoff (5s, 10s, 20s)
- **Completed jobs kept for 24 hours** (max 1000 jobs)
- **Failed jobs kept for 7 days** (max 5000 jobs)

### Cleanup

Periodically clean old jobs to prevent queue bloat:

```typescript
import { cleanOldJobs } from "~/lib/queues/render-queue";

// Clean jobs older than 7 days (default)
await cleanOldJobs();

// Custom max age (e.g., 3 days)
await cleanOldJobs(3 * 24 * 60 * 60 * 1000);
```

### Queue Status Endpoint

Check queue health via API:

```bash
curl http://localhost:3000/api/queues/render/status | jq .
```

Response:
```json
{
  "success": true,
  "queue": "render",
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 100,
    "failed": 1
  },
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

### Environment Variables

BullMQ requires Redis connection via native Redis URL (not REST API):

```bash
# Option 1: Native Redis URL (preferred)
UPSTASH_REDIS_URL="rediss://default:password@host.upstash.io:6379"

# Option 2: Fallback construction from REST URL
# If UPSTASH_REDIS_URL is not set, the queue will construct it from:
UPSTASH_REDIS_REST_URL="https://host.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-rest-token"
```

Get the native URL from Upstash Console → Details → Connection → "Native Redis URL"

### Worker Implementation (Next Steps)

To process jobs, implement a worker:

```typescript
// worker.ts (separate process)
import { Worker } from "bullmq";
import { RenderJobData } from "~/lib/queues/render-queue";

const worker = new Worker<RenderJobData>(
  "render",
  async (job) => {
    const { projectId, exportId, exportType, userId, slideIds } = job.data;

    // Update status to PROCESSING
    await updateExportStatus(exportId, "PROCESSING");

    try {
      // Render slides to PDF/PNG
      const fileUrl = await renderExport(projectId, slideIds, exportType);

      // Update status to COMPLETED
      await updateExportStatus(exportId, "COMPLETED", fileUrl);

      return { success: true, fileUrl };
    } catch (error) {
      // Update status to FAILED
      await updateExportStatus(exportId, "FAILED", null, error.message);
      throw error;
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 5, // Process up to 5 jobs concurrently
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
```


## PDF Generation

The `generate-pdf.ts` module provides server-side PDF generation from rendered slide images using PDFKit.

### Basic Usage

```typescript
import { generatePDF } from "~/lib/generate-pdf";
import type { SlideData } from "~/components/editor/types";

// Generate PDF from slides
const slides: SlideData[] = [
  {
    blueprint: {
      layers: [
        { type: "background" },
        {
          type: "text_box",
          id: "headline",
          position: { x: 100, y: 100, width: 880, height: 200 },
          constraints: { min_font: 24, max_font: 48, max_lines: 2 },
        },
      ],
    },
    content: { headline: "Your Slide Title" },
    styleKit: {
      typography: {
        headline_font: "Inter",
        headline_weight: 700,
        body_font: "Inter",
        body_weight: 400,
      },
      colors: {
        background: "#FFFFFF",
        foreground: "#000000",
        accent: "#3B82F6",
      },
      spacingRules: {
        padding: "normal",
        line_height: 1.5,
      },
    },
  },
];

const pdfBuffer = await generatePDF(slides);

// Return as download
return new Response(pdfBuffer, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": "attachment; filename=carousel.pdf",
  },
});
```

### API Functions

#### `generatePDF(slides: SlideData[]): Promise<Buffer>`

Generates a multi-page PDF from an array of slides. Each slide is rendered to a PNG image using `@napi-rs/canvas`, then embedded in the PDF.

**Parameters:**
- `slides`: Array of slide data with layouts, content, and style kits

**Returns:** PDF buffer

**Features:**
- Multi-page PDF generation
- LinkedIn portrait dimensions (1080x1350)
- Full-bleed images (no margins)
- Embedded slide images

#### `generatePDFToFile(slides: SlideData[], outputPath: string): Promise<void>`

Generates a PDF and saves it to disk (Node.js only).

**Parameters:**
- `slides`: Array of slide data
- `outputPath`: Absolute or relative path to save PDF

**Example:**
```typescript
await generatePDFToFile(slides, "./output/carousel.pdf");
```

#### `generatePDFBase64(slides: SlideData[]): Promise<string>`

Generates a PDF and returns it as a base64 string. Useful for API responses or browser downloads.

**Parameters:**
- `slides`: Array of slide data

**Returns:** Base64-encoded PDF string

**Example:**
```typescript
const base64 = await generatePDFBase64(slides);
return NextResponse.json({ pdf: base64 });
```

### Integration with Rendering Pipeline

PDF generation integrates with the server-side slide renderer:

```
┌──────────────────────────────────────────────────────┐
│  1. Slides (SlideData[]) with content + styles       │
├──────────────────────────────────────────────────────┤
│  2. renderSlidesToCanvas() → PNG buffers             │
│     - Uses @napi-rs/canvas for server rendering      │
│     - Auto-fit text within constraints                │
│     - Apply style kit colors and fonts                │
├──────────────────────────────────────────────────────┤
│  3. generatePDF() → PDF buffer                        │
│     - Create multi-page PDF document                  │
│     - Embed PNG images as full-bleed pages            │
│     - LinkedIn dimensions (1080x1350)                 │
└──────────────────────────────────────────────────────┘
```

### PDF Dimensions

All PDFs are generated at LinkedIn's optimal carousel dimensions:
- **Width:** 1080 points (15 inches at 72 DPI)
- **Height:** 1350 points (18.75 inches at 72 DPI)
- **Format:** Portrait orientation
- **Margins:** None (full-bleed images)

### Error Handling

```typescript
try {
  const pdfBuffer = await generatePDF(slides);
  return new Response(pdfBuffer, {
    headers: { "Content-Type": "application/pdf" },
  });
} catch (error) {
  console.error("PDF generation failed:", error);
  throw ApiErrors.internal("Failed to generate PDF");
}
```

### Performance Notes

- PDF generation is I/O intensive - use worker queues for production
- Each slide is rendered to PNG first (~1-2s per slide)
- PDF assembly is fast (~100ms)
- Total time: ~2-5s for 10-slide carousel

### Testing

```bash
# Run PDF generation tests
bun run test src/lib/generate-pdf.test.ts
```

## Export Job Processing

### BullMQ Worker for Background Exports

The export system uses BullMQ to process carousel exports in the background. This ensures the API remains responsive while rendering PDFs and PNGs.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Export Flow                                                 │
├─────────────────────────────────────────────────────────────┤
│  1. API receives export request                              │
│     - Create Export record (status: PENDING)                │
│     - Add job to render queue                               │
│     - Return exportId to client                             │
├─────────────────────────────────────────────────────────────┤
│  2. Worker picks up job from queue                          │
│     - Update status to PROCESSING                           │
│     - Fetch project and slide data                          │
│     - Render slides to PNG/PDF                              │
│     - Upload to storage                                     │
│     - Update status to COMPLETED with fileUrl               │
├─────────────────────────────────────────────────────────────┤
│  3. Client polls for completion                              │
│     - GET /api/exports/:id checks status                    │
│     - When COMPLETED, download from fileUrl                 │
└─────────────────────────────────────────────────────────────┘
```

### Adding Jobs to Queue

```typescript
import { addRenderJob } from '~/lib/queues';

// Add PDF export job
await addRenderJob({
  projectId: 'proj_123',
  exportId: 'exp_456',
  exportType: 'PDF',
  userId: 'user_789',
  slideIds: ['slide_1', 'slide_2'],
});

// Add PNG export job (all slides as individual images)
await addRenderJob({
  projectId: 'proj_123',
  exportId: 'exp_789',
  exportType: 'PNG',
  userId: 'user_789',
  slideIds: ['slide_1', 'slide_2'],
});

// Add thumbnail export job (first slide only)
await addRenderJob({
  projectId: 'proj_123',
  exportId: 'exp_012',
  exportType: 'THUMBNAIL',
  userId: 'user_789',
  slideIds: ['slide_1'],
});
```

### Running the Worker

#### Development

```bash
# Start worker in development
cd apps/nextjs
bun run worker:dev

# Or with ts-node
node --loader ts-node/esm src/lib/queues/render-worker.ts
```

#### Production (Fly.io / Render)

```bash
# Dockerfile example
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN bun install --production
CMD ["bun", "run", "src/lib/queues/render-worker.ts"]
```

#### Environment Variables Required

```bash
# Redis connection (for BullMQ)
UPSTASH_REDIS_URL=rediss://default:password@host:6379

# Database connection
POSTGRES_URL=postgresql://user:pass@host:5432/db

# Supabase (for storage)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Monitoring Queue

```typescript
import { getQueueStats, getJobStatus } from '~/lib/queues';

// Get queue statistics
const stats = await getQueueStats();
console.log(stats);
// { waiting: 5, active: 2, completed: 100, failed: 1 }

// Get specific job status
const job = await getJobStatus('exp_456');
console.log(job);
// { id: 'exp_456', state: 'completed', progress: 100, ... }
```

### Job Processing Details

#### PDF Export
1. Fetch project and slides from database
2. Render each slide to PNG buffer using @napi-rs/canvas
3. Generate multi-page PDF using PDFKit
4. Upload PDF to storage bucket
5. Update Export.status to COMPLETED with fileUrl

#### PNG Export
1. Fetch project and slides from database
2. Render each slide to PNG buffer
3. Upload all PNGs to storage bucket
4. Store array of URLs in Export.fileUrl as JSON
5. Update Export.status to COMPLETED

#### Thumbnail Export
1. Fetch project and slides from database
2. Render only the first slide to PNG buffer
3. Upload to storage bucket
4. Update Export.status to COMPLETED with fileUrl

### Error Handling

When a job fails:
- Export.status is updated to FAILED
- Export.errorMessage contains the error details
- Job is retried up to 3 times with exponential backoff
- Failed jobs are kept for 7 days for debugging

### Graceful Shutdown

The worker handles SIGTERM and SIGINT signals:

```typescript
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});
```

This ensures in-progress jobs are completed before shutdown.

### Scaling

- **Concurrency**: Worker processes 2 jobs at a time by default
- **Multiple Workers**: Deploy multiple worker instances for higher throughput
- **Queue Priority**: PDF exports can be given higher priority than thumbnails

```typescript
// Add job with priority (lower number = higher priority)
await addRenderJob(data, 5); // High priority
await addRenderJob(data, 10); // Normal priority
await addRenderJob(data, 20); // Low priority
```
