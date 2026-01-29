# API Error Handling & Validation

This directory contains utilities for consistent error handling and request validation across all API routes.

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
