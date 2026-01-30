# Ralph Test Discovery - Knowledge Base

> Read this FIRST at the start of each iteration.
> Append learnings at the END after each module analysis.

---

## ⚠️ Guardrails (Pitfalls to Avoid)

### Sign: Understand Before Writing Tests
- **Trigger**: Before creating test cases
- **Do**: Actually read and understand the code first

### Sign: Business Perspective
- **Trigger**: When writing test descriptions
- **Do**: Think like a user/business analyst, not a developer

### Sign: Ideal State, Not Current State
- **Trigger**: When writing acceptance criteria
- **Do**: Define what SHOULD happen, even if current code is buggy

### Sign: No Duplicate Tests
- **Trigger**: Before adding a test case
- **Do**: Check if similar test already exists

### Sign: Specific Expected Values
- **Trigger**: When writing acceptance criteria
- **Do**: Include specific, measurable outcomes, not vague "it works"

### Sign: Discovery Only - No Execution
- **Trigger**: Always
- **Do**: Write test definitions only, do NOT run/execute tests

---

## 🔧 Test Case Patterns

### API Test Pattern
```json
{
  "category": "api",
  "steps": [
    {"step": 1, "action": "Send GET request to /api/projects", "expected": "Returns 200 with array of projects"},
    {"step": 2, "action": "Check response has correct fields", "expected": "Each project has id, title, createdAt"}
  ]
}
```

### UI Test Pattern
```json
{
  "category": "frontend",
  "steps": [
    {"step": 1, "action": "Navigate to /en/create", "expected": "Create page loads"},
    {"step": 2, "action": "Click on Topic mode tab", "expected": "Topic input form appears"},
    {"step": 3, "action": "Enter topic text", "expected": "Character count updates"}
  ]
}
```

### E2E Journey Pattern
```json
{
  "category": "e2e",
  "preconditions": ["User is logged in", "No existing projects"],
  "steps": [
    {"step": 1, "action": "Navigate to dashboard", "expected": "Empty state message shown"},
    {"step": 2, "action": "Click Create New Carousel", "expected": "Redirects to /create"},
    {"step": 3, "action": "Complete generation flow", "expected": "New project appears on dashboard"}
  ]
}
```

---

## 🧠 Codebase Patterns Discovered

### Local Services (All Configured ✅)
- **PostgreSQL** (Docker): localhost:5432 - Main database
- **Supabase** (Local): http://127.0.0.1:54321 - Auth, Storage, Realtime, DB
  - Studio GUI: http://127.0.0.1:54323 (for database management)
  - S3 Storage: Built-in at http://127.0.0.1:54321/storage/v1/s3 (no Cloudflare R2 needed)
- **Redis**: Upstash Cloud (not local, see .env for credentials)
- **API Keys**: All real keys configured in .env/.env.local
  - ✅ Clerk (auth), Stripe (payments), GitHub OAuth, Resend (email), OpenAI (AI)

### Project Structure
- **Monorepo**: Workspace root contains multiple apps and packages
- **Main app**: `apps/nextjs/` - Next.js application
- **Packages**: `packages/auth/`, `packages/db/`, `packages/ui/` - shared code
- **Config files**: Root .env.local is used by apps/nextjs via dotenv

### Environment Variables
- **Multiple env.mjs files**: Both `apps/nextjs/src/env.mjs` and `packages/auth/env.mjs` validate env vars
- **T3 env validation**: Uses @t3-oss/env-nextjs with Zod schemas - all required vars must be set
- **Environment file location**: `.env.local` at repo root (../../.env.local from apps/nextjs)

### Authentication & Middleware
- **Auth provider**: Uses Clerk for authentication
- **Middleware**: Located at `apps/nextjs/src/utils/clerk.ts` (not src/middleware.ts)
- **Route protection**: Clerk middleware intercepts ALL routes unless explicitly excluded
- **Public routes**: Must be added to `isPublicRoute` matcher or bypassed in middleware
- **Webhooks exception**: `/api/webhooks/*` is already excluded from auth

### Next.js Configuration
- **API routes**: Located in `apps/nextjs/src/app/api/[route]/route.ts`
- **Runtime**: Can use `export const runtime = "edge"` for edge functions
- **Dev server**: Runs on port 3000, Next Devtools tries to use ports 12882-12883

### Browser Debugging (Chrome DevTools MCP)
- **Use Chrome DevTools MCP** for frontend testing - SEE actual pages, not just code
- Available tools:
  - `navigate_page` - Go to a URL
  - `take_screenshot` - Save visual state to `.ralph-test/screenshots/`
  - `take_snapshot` - Get page structure and element refs
  - `list_console_messages` - Check for JS errors/warnings
  - `list_network_requests` - See API calls and responses
  - `click_element` - Interact with UI elements
  - `type_text` - Enter text into inputs
- **Start dev server first**: `bun dev` before using browser tools
- **Save screenshots**: Document UI state for complex modules

### API Testing
- Use `curl` to test API endpoints directly
- Check actual response formats, error messages
- Test both success and error cases
- Save responses to `.ralph-test/logs/` for reference

### Environment Variables
- `$BASE_URL` - Dev server (default: http://localhost:3000)
- `$SCREENSHOT_DIR` - Screenshot output (.ralph-test/screenshots)
- `$LOG_DIR` - Log output (.ralph-test/logs)

<!-- Agent adds patterns about this codebase here -->

---

## 🔴 Potential Issues Noticed

| Module | Issue Type | Description |
|--------|-----------|-------------|
| auth | Critical | Profile creation depends on Clerk webhook - if webhook fails, user can authenticate but all API calls fail (no Profile found). No fallback mechanism. |
| auth | Medium | Admin email list stored in plain env var (ADMIN_EMAIL) - comma-separated parsing could fail with spaces or invalid emails. |
| auth | Low | API routes return 401 JSON while pages redirect to login - inconsistent behavior could confuse mobile/SPA clients. |
| auth | Medium | Logout implementation not found in analyzed files - need to verify user menu/navigation components have logout functionality. |
| generation_topic | Medium | Slide count validation logs warning but doesn't fail request when outside 8-12 range - could produce unusable carousels. |
| generation_topic | Low | Brand kit lookup with multiple kits at same createdAt timestamp may return unpredictable results (orderBy race condition). |
| generation_topic | High | No user tier validation - free tier users can generate unlimited carousels, should check subscription limits. |
| generation_topic | Low | OpenAI API key validation only happens on first request, not at app startup - delayed error discovery. |
| generation_topic | Medium | Error messages for AI validation failures could be more specific about why generation failed (currently generic "Failed to generate"). |

<!-- Agent adds issues discovered during code analysis here -->

---

## 📝 Iteration Log

<!-- Agent appends learnings after each module analysis below this line -->

---
## Iteration 1 - Authentication Module

**Files analyzed**:
- apps/nextjs/src/app/[lang]/(auth)/login-clerk/[[...rest]]/page.tsx
- apps/nextjs/src/app/[lang]/(auth)/register/page.tsx
- apps/nextjs/src/app/[lang]/(auth)/layout.tsx
- apps/nextjs/src/middleware.ts
- apps/nextjs/src/lib/with-auth.ts
- apps/nextjs/src/utils/clerk.ts
- apps/nextjs/src/components/user-clerk-auth-form.tsx
- apps/nextjs/src/app/api/projects/route.ts (for auth pattern validation)
- packages/db/prisma/schema.prisma (Profile model)

**Test cases created**: 10 (TC-AUTH-001 through TC-AUTH-010)

**Key business logic discovered**:
- **Authentication Provider**: Uses Clerk (third-party managed auth) - no custom auth implementation
- **Login Flow**: /[lang]/login-clerk → Clerk SignIn component → auto-redirect to dashboard on success
- **Registration Flow**: /[lang]/register → Clerk SignUp component → creates Profile record → redirect to dashboard
- **Protected Routes**: Middleware intercepts ALL routes, redirects unauthenticated users to login with ?from= param
- **API Protection**: withAuth() and withAuthAndErrors() wrappers return 401 JSON for unauthenticated API calls
- **Profile Model**: Links Clerk userId to app data (subscriptionTier, projects, brandKits)
- **Public Routes**: Marketing pages (/, /pricing, /terms, /privacy) bypass auth
- **Webhook Routes**: /api/webhooks/* and /api/health excluded from auth checks
- **Admin Access**: Special email-based admin check for /admin/* routes
- **Locale Handling**: Middleware adds locale prefix (/en/) to routes automatically
- **Session Management**: Handled entirely by Clerk - app trusts Clerk session tokens

**Potential bugs noticed**:
1. **Profile Webhook Dependency**: Profile record creation depends on Clerk webhook. If webhook fails, user can authenticate but API calls fail (no Profile record found). No fallback mechanism observed.
2. **Admin Email Security**: Admin emails stored in plain env var (ADMIN_EMAIL). Comma-separated list could cause issues with spaces or validation.
3. **API vs Route Auth Mismatch**: API routes receive 401 JSON, but page routes redirect to login. Mobile/SPA clients might not handle redirects properly on API calls.
4. **Logout Implementation Unknown**: No logout button found in analyzed files - need to verify implementation exists in navigation/user menu components.
5. **Locale Detection Edge Case**: Negotiator fallback might not work correctly for all browser/locale combinations.

**Patterns for other modules**:
- **API Protection Pattern**: Use withAuth() or withAuthAndErrors() wrappers consistently
- **Profile Lookup**: All API routes get userId from Clerk, then query Profile by clerkUserId
- **Error Response Format**: Standardized ApiError format with code + message + optional details
- **Testing Strategy**: Test both UI flow (Clerk component) and middleware behavior (redirects/401s)
- **Database Foreign Keys**: userId in all models refers to Profile.id (not Clerk's userId directly)

**Additional insights**:
- Dev server successfully started and tested live API behavior (401 responses verified)
- Clerk handles all password validation, rate limiting, email verification
- App has strong separation: Clerk = identity, Profile = app-specific user data
- Middleware is complex (100+ lines) handling: auth, locale, admin, webhooks, public routes
---

---
## Iteration 2 - Topic Generation API

**Files analyzed**:
- apps/nextjs/src/app/api/generate/topic/route.ts
- apps/nextjs/src/lib/openai.ts
- apps/nextjs/src/lib/api-error.ts
- apps/nextjs/src/lib/validations/api.ts

**Test cases created**: 11 (TC-GENTOPIC-001 through TC-GENTOPIC-011)

**Key business logic discovered**:
- **3-Stage AI Pipeline**: 
  1. `generateSlidePlan` - Creates structured slide plan (hook, promise, value slides, recap, CTA)
  2. `generateSlideCopy` - Generates detailed copy (headlines, body bullets, emphasis phrases)
  3. `selectLayoutsForSlides` - Maps slides to TemplateLayout IDs based on slide type + text length
- **OpenAI Integration**: Uses OpenAI GPT-4.1 (configurable via OPENAI_MODEL env var) with structured JSON output
- **Retry Logic**: Built-in retry mechanism with exponential backoff (1s, 2s, 5s) for transient errors
- **Timeout Handling**: 30-second default timeout per API call, with timeout detection in route handler
- **Rate Limit Handling**: Detects OpenAI 429 errors and returns proper 429 response with retryAfter
- **Input Validation**: 
  - topic: 1-500 characters (required)
  - slideCount: 8-12 (default: 10)
  - tone: enum ['bold', 'calm', 'contrarian', 'professional'] (default: 'professional')
  - applyBrandKit: boolean (default: false)
- **Brand Kit Integration**: Optional - fetches user's default BrandKit and attaches to slides (doesn't affect AI generation)
- **Layout Selection Logic**: Maps slide types to layouts with text length consideration:
  - hook → hook_big_headline (short) or generic_single_focus (long)
  - promise → promise_two_column
  - value → value_bullets (short) or value_numbered_steps (long)
  - recap → recap_grid
  - cta → cta_centered
  - Unknown → generic_single_focus (fallback)
- **Error Handling**: 
  - Empty AI response detection (line 109-111)
  - Copy/plan mismatch handling with fallback (lines 117-120, 128-132)
  - Timeout detection (error.message includes 'timeout')
  - Rate limit detection (error.message includes 'rate limit')

**Potential bugs noticed**:
1. **No Retry for Non-Retryable Errors**: OpenAI validation errors (bad schema) are not retried, which is correct, but error messages could be more specific about why generation failed
2. **Slide Count Warning Only**: Lines 157-161 log warning if slide count is outside 8-12 range, but don't fail request - this could produce unusable carousels
3. **Brand Kit Lookup Race Condition**: If user has multiple brand kits with same createdAt timestamp, orderBy may return unpredictable results
4. **No User Tier Validation**: No check if user's subscription tier allows generation (should check if free tier has hit limit)
5. **OpenAI API Key Not Validated on Startup**: Error only thrown when first request is made - should validate at app startup

**Patterns for other modules**:
- **API Route Structure**: withAuthAndErrors wrapper → validateBody → business logic → return NextResponse.json
- **Error Response Format**: Consistent ApiError with code, message, details (same pattern as auth)
- **Zod Validation**: Use validateBody helper with Zod schemas for all API input validation
- **OpenAI Pattern**: Use generateStructuredOutput with schema for type-safe AI responses
- **Graceful Degradation**: Log warnings for non-critical issues (like mismatches), use fallback data
- **Database Queries**: Use Kysely for type-safe queries, orderBy for deterministic results
- **Testing Strategy**: Test happy path, validation errors, timeout/rate limit errors, edge cases (empty responses, mismatches)

**Codebase patterns discovered**:
- **TemplateLayout System**: 9 seeded layouts in database (hook_big_headline, promise_two_column, value_bullets, value_numbered_steps, value_text_left_visual_right, value_centered_quote, recap_grid, cta_centered, generic_single_focus)
- **OpenAI Configuration**: Model, timeout, retry settings centralized in openai.ts
- **Structured Output**: OpenAI JSON mode + Zod validation ensures type-safe AI responses
- **Error Class Hierarchy**: ApiError base class with specific error types (ApiErrors.validation, ApiErrors.rateLimited, etc.)

**Additional insights**:
- Live testing confirmed 401 auth protection working correctly
- Generation is the most expensive operation (OpenAI API costs, 10-30s latency)
- AI pipeline is sequential - can't parallelize the 3 steps
- Layout selection is deterministic (pure function based on slide type + text length)
- Brand kit attachment happens after AI generation (doesn't influence AI)
---

