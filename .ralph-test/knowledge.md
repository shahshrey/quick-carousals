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

<!-- Agent adds issues discovered during code analysis here -->

---

## 📝 Iteration Log

<!-- Agent appends learnings after each module analysis below this line -->

