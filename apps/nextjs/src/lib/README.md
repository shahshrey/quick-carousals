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

