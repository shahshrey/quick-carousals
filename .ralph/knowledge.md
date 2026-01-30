# Ralph Knowledge Base

> Read this FIRST at the start of each iteration.
> Append learnings at the END after each task.

---

## ⚠️ Guardrails (Pitfalls to Avoid)

### Sign: Read Before Writing
- **Trigger**: Before modifying any file
- **Do**: Always read the existing file first

### Sign: Test Before Marking Complete
- **Trigger**: Before setting `"passes": true`
- **Do**: Run tests, check browser, verify it actually works

### Sign: Commit Early and Often
- **Trigger**: After any significant change
- **Do**: Commit immediately - your commits ARE your memory across rotations

### Sign: Fix Services Before Proceeding
- **Trigger**: Database/server not running
- **Do**: Fix it first, don't skip or defer

### Sign: Don't Create Nested Git Repos
- **Trigger**: When scaffolding projects
- **Do**: Never run `git init` - repo already exists. Use `--no-git` flags.

---

## 🔧 Working Commands

```bash
# Local Services
docker-compose up -d           # Start PostgreSQL
supabase start                 # Start Supabase (DB, Auth, Storage, Realtime)
docker ps --filter "name=quickcarousals"  # Check Docker containers
supabase status                # Check Supabase status

# Development server
bun install                    # Install all dependencies (from repo root)
cd apps/nextjs && bun dev      # Start dev server on :3000

# Database connections
# PostgreSQL: postgresql://quickcarousals:quickcarousals_dev_password@localhost:5432/quickcarousals
# Supabase: postgresql://postgres:postgres@127.0.0.1:54325/postgres
# Redis: Upstash Cloud (see UPSTASH_REDIS_REST_URL in .env)

# Validation
jq -r '.name' package.json     # Check package name
grep -q 'QuickCarousals' apps/nextjs/src/config/site.ts  # Check branding
test -f apps/nextjs/public/favicon.ico  # Check favicon exists
curl -s http://localhost:3000/_next/static/development/_buildManifest.js  # Check server health

# Browser debugging (Chrome DevTools MCP) or browser agent cli



# Task management
jq '.[] | select(.id == "task-id")' .ralph/tasks.json  # Get task details
jq '(.[] | select(.id == "task-id") | .passes) = true' .ralph/tasks.json > .ralph/tasks.json.tmp && mv .ralph/tasks.json.tmp .ralph/tasks.json  # Mark task complete

# Process management
lsof -ti:3000                  # Find process on port 3000
kill $(lsof -ti:3000)          # Kill process on port 3000
```

---

## 🧠 Codebase Patterns

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

### Browser Debugging
- **Use Chrome DevTools MCP** instead of curl for frontend testing
- Available tools: navigate_page, list_console_messages, list_network_requests, take_screenshot
- See .ralph/prompt.md section "Testing Your Changes" for CallMcpTool examples

---

## 🔴 Error → Fix Map

| Error | Fix |
|-------|-----|
| `Invalid environment variables: { GITHUB_CLIENT_ID: [ 'Required' ] }` | Add all required env vars to .env.local (check both apps/nextjs/src/env.mjs and packages/auth/env.mjs) |
| `Cannot find package '@saasfly/auth'` | Run `bun install` from repo root to install workspace dependencies |
| `address already in use :::3000` | Kill existing process: `kill $(lsof -ti:3000)` |
| `Publishable key not valid` (Clerk error) | Clerk middleware blocking routes - add placeholder keys or exclude route from middleware |
| Dev server returns 500 but is running | Check if static assets serve: `curl http://localhost:3000/_next/static/development/_buildManifest.js` |

---

## 📝 Iteration Log

<!-- Append your learnings below this line -->
<!-- Format:
---
## Iteration N - task-id
- **Result**: PASS/FAIL
- **What was done**: Brief description
- **Learnings**:
  - Pattern discovered
  - Gotcha encountered
  - Command that worked
---
-->

---
## Iteration 1 - setup-01
- **What was done**: Validated package metadata and README configuration
- **Files changed**: .ralph/tasks.json (marked task as complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - The setup-01 task was already completed in previous work - all package.json files had correct names, README was rewritten for QuickCarousals, and .env.example existed with documentation
  - Validation commands: `jq -r '.name' package.json` successfully verified package naming
  - `grep -q 'QuickCarousals' README.md` confirmed README was properly updated
  - Use `jq` to update tasks.json: `jq '(.[] | select(.id == "setup-01") | .passes) = true' .ralph/tasks.json`
  - Always validate BEFORE marking complete - even if work appears done, run validation commands to verify
---

---
## Iteration 2 - setup-02
- **What was done**: Updated site configuration and branding assets, configured environment for dev server
- **Files changed**: 
  - .env.local (created with required environment variables)
  - apps/nextjs/src/app/api/health/route.ts (created health check endpoint)
  - apps/nextjs/src/utils/clerk.ts (updated middleware to bypass auth for health endpoint)
  - .ralph/tasks.json (marked task complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **Branding files were already complete** from previous work (site.ts, favicon.ico, logo.svg, globals.css)
  - **Environment setup required**: The dev server needs proper env vars to start
  - **Critical env vars for Next.js dev server**: 
    - NEXTAUTH_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET (required by packages/auth/env.mjs)
    - STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, RESEND_FROM (all required)
    - Use placeholder values for dev: `'placeholder_value'` (enough to pass validation)
  - **Dependencies must be installed**: Run `bun install` from repo root before starting dev server
  - **Clerk middleware blocks ALL routes** by default - need to explicitly exclude public routes
  - **Dev server validation**: Server returning 500 due to auth doesn't mean it's broken - check if static assets serve (/_next/static/...) to verify server health
  - **Working command**: `cd apps/nextjs && bun dev` (runs from apps/nextjs directory, uses ../../.env.local)
  - **Kill old processes**: Check `lsof -ti:3000` and kill before restarting
---

---
## Iteration 3 - setup-03
- **What was done**: Validated landing page with QuickCarousals branding and hero_headline testid
- **Files changed**: 
  - .ralph/tasks.json (marked task complete)
  - .ralph/screenshots/setup/landing-page.png (validation screenshot)
- **Result**: PASS
- **Learnings for future iterations**:
  - **Landing page was already complete** from previous work - hero section, features, and CTAs were already updated for QuickCarousals
  - **Chrome DevTools MCP validation workflow**:
    - Use `chrome-devtools-navigate_page` to open the URL
    - Use `chrome-devtools-take_snapshot` to get page structure
    - Use `chrome-devtools-list_console_messages` with types ["error", "warn"] to check for errors
    - Use `chrome-devtools-list_network_requests` to verify successful page loads (200 status)
    - Use `chrome-devtools-take_screenshot` to capture visual evidence
    - Use `chrome-devtools-evaluate_script` to verify DOM elements programmatically
  - **Validation script pattern**: Can execute JavaScript in the browser context to verify elements exist:
    ```javascript
    () => {
      const element = document.querySelector('[data-testid="hero_headline"]');
      return { exists: !!element, textContent: element?.textContent };
    }
    ```
  - **Expected warnings**: Clerk development mode warnings are normal and don't indicate errors
  - **Task was already complete**: When validation passes immediately, it means previous iterations did the work - just validate and mark complete
  - **Screenshot directory**: Must create `.ralph/screenshots/setup/` before saving screenshots
---

---
## Iteration 4 - setup-04
- **What was done**: Updated auth pages (login, login-clerk, register) with QuickCarousals branding and added data-testid attributes
- **Files changed**: 
  - apps/nextjs/src/app/[lang]/(auth)/login/page.tsx (updated metadata and content)
  - apps/nextjs/src/app/[lang]/(auth)/login-clerk/[[...rest]]/page.tsx (updated metadata and content)
  - apps/nextjs/src/app/[lang]/(auth)/register/page.tsx (updated metadata and content)
  - .ralph/tasks.json (marked task complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **Multiple login routes exist**: This project has both `/login` and `/login-clerk` - the latter is the actual Clerk-based auth route
  - **Auth pages follow similar structure**: All auth pages (login, login-clerk, register) share similar structure with metadata, heading, and helper text
  - **Validation without browser tools**: When browser tools aren't working, curl + grep is effective:
    - `curl -s URL | grep -o 'data-testid="auth_title"'` to verify testid
    - `curl -s URL | grep -o 'QuickCarousals'` to verify branding
    - `curl -s URL -o /dev/null -w "%{http_code}"` to check HTTP status
  - **Consistent branding approach**: 
    - Metadata: "Log in to QuickCarousals" / "Join QuickCarousals"
    - Heading: "Welcome back to QuickCarousals" / "Start creating with QuickCarousals"
    - Helper text: Reference "LinkedIn carousels" to be specific about the product
  - **data-testid naming**: Use snake_case for testids (e.g., `auth_title`) as per project conventions
  - **Task completion workflow**: Read files → Update files → Validate with curl → Mark complete → Commit → Log learnings
---

---
## Iteration 5 - setup-05
- **What was done**: Updated i18n dictionaries with QuickCarousals branding across all language files
- **Files changed**: 
  - apps/nextjs/src/config/dictionaries/en.json (updated with QuickCarousals marketing copy)
  - apps/nextjs/src/config/dictionaries/ja.json (Japanese translations)
  - apps/nextjs/src/config/dictionaries/ko.json (Korean translations)
  - apps/nextjs/src/config/dictionaries/zh.json (Chinese translations)
  - .ralph/tasks.json (marked task complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **i18n files location**: `apps/nextjs/src/config/dictionaries/*.json` - separate file per language
  - **Dictionary structure**: Nested JSON with keys like `marketing`, `price`, `login`, `common`, `business`, `dropdown`
  - **Branding updates required**: Changed all references from "Saasfly" to "QuickCarousals", updated marketing copy to reflect LinkedIn carousel creation product
  - **JSON validation critical**: Use `jq '.' file.json` to validate JSON syntax before committing
  - **Character encoding gotcha**: Chinese quotation marks (""） break JSON - use standard double quotes or Chinese corner brackets (「」)
  - **Validation workflow**: Check both content (`grep -q 'QuickCarousals'`) and JSON validity (`jq '.'`) for each file
  - **Product-specific copy**: Updated marketing text to emphasize:
    - LinkedIn-first carousel creation
    - 3-minute creation time
    - Auto-fit text feature
    - 8 style kits
    - Brand kit functionality
    - PDF/PNG export
  - **Translation approach**: Maintained similar structure across all languages, adapted marketing messages to cultural context
  - **Working commands**:
    - `jq '.' file.json > /dev/null && echo 'PASS' || echo 'FAIL'` - validate JSON
    - `grep -q 'QuickCarousals' file.json && echo 'PASS' || echo 'FAIL'` - check branding
---

---
## Iteration 7 - setup-06
- **What was done**: Added Profile model to Prisma schema with SubscriptionTier enum
- **Files changed**: 
  - packages/db/prisma/schema.prisma (added Profile model and SubscriptionTier enum)
  - .ralph/tasks.json (marked task complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **Prisma schema workflow**: Always run `cd packages/db && bun db:push` after schema changes to apply to database
  - **Database verification**: Use `docker exec quickcarousals-postgres psql -U quickcarousals -d quickcarousals -c "\d \"TableName\""` to verify table structure
  - **Profile model structure**: Successfully added with:
    - SubscriptionTier enum (FREE, CREATOR, PRO) - distinct from existing SubscriptionPlan enum
    - clerkUserId field (unique, indexed) - links to Clerk authentication
    - email field (unique, indexed)
    - subscriptionTier with FREE default
    - Standard timestamps (createdAt, updatedAt)
  - **Indexes created automatically**: Prisma creates both unique constraints and indexes for @unique fields, plus additional @@index directives
  - **Type generation**: Prisma generates Kysely types automatically (types.ts, enums.ts) via the prisma-kysely generator
  - **Validation from correct directory**: Run validation commands from repo root, not from subdirectories
  - **Database is healthy**: PostgreSQL Docker container running on localhost:5432, connection working properly
---

---
## Iteration 9 - setup-07
- **What was done**: Added StyleKit model to Prisma schema with isPremium flag and created seed script for 8 default style kits
- **Files changed**: 
  - packages/db/prisma/schema.prisma (added StyleKit model)
  - packages/db/prisma/seed.ts (created seed script)
  - packages/db/package.json (added pg dependency and db:seed script)
  - packages/db/prisma/types.ts (generated by Prisma)
  - .ralph/tasks.json (marked setup-07 complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **Prisma JSON fields**: When using `Json` type in Prisma schema, the generated Kysely types use `unknown` type - this is correct and expected
  - **Seed script workflow**: 
    - Create seed script in `packages/db/prisma/seed.ts`
    - Add npm script: `"db:seed": "bun with-env bun run prisma/seed.ts"` (use bun, not tsx)
    - Use dotenv-cli wrapper via `with-env` script to load environment variables from ../../.env.local
    - Always add idempotency check (skip if data already exists)
  - **pg package required**: Must add `pg` to dependencies (not just @types/pg in devDependencies) for Kysely Pool to work
  - **Kysely type generation**: 
    - Run `bunx prisma generate` after schema changes
    - Types are generated in `packages/db/prisma/types.ts` and `enums.ts`
    - Types automatically include all models from schema
  - **StyleKit data structure** (from PRD):
    - 8 default kits: 4 free, 4 premium
    - Free: minimal_clean, high_contrast_punch, marker_highlight, sticky_note
    - Premium: corporate_pro, gradient_modern, dark_mode_punch, soft_pastel
    - Each kit has typography (headline/body font + weights), colors (background/foreground/accent), spacingRules (padding/line_height)
  - **Database validation**: Use PostgreSQL queries to verify seed data: `SELECT COUNT(*) FILTER (WHERE condition)` syntax for conditional counts
  - **Working command**: `bun db:seed` to run seed script with proper environment loading
---
## Iteration 10 - setup-08
- **What was done**: Validated TemplateLayout model and seed data (task was already completed by previous iteration, but database needed to be started)
- **Files changed**: 
  - .ralph/tasks.json (marked setup-08 complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **CRITICAL: Always check service status FIRST** - The database container was stopped, which caused validation to fail
  - **Service restart workflow**: `docker-compose up -d` to start services, then `sleep 3 && docker ps` to verify
  - **The task was already complete**: TemplateLayout model existed in schema, table was created, and 9 layouts were seeded
  - **Previous iteration completed the work**: The model, seed script, and db:push were all done - just needed to validate
  - **Database validation commands**:
    - `docker exec quickcarousals-postgres psql -U quickcarousals -d quickcarousals -c "\d \"TableName\""` - show table structure
    - `docker exec quickcarousals-postgres psql -U quickcarousals -d quickcarousals -c "SELECT COUNT(*) FROM \"TableName\";"` - count records
    - `docker exec quickcarousals-postgres psql -U quickcarousals -d quickcarousals -c "SELECT * FROM \"TableName\" ORDER BY id;"` - list records
  - **TemplateLayout structure validated**:
    - 9 layouts seeded: hook_big_headline, promise_two_column, value_bullets, value_numbered_steps, value_text_left_visual_right, value_centered_quote, recap_grid, cta_centered, generic_single_focus
    - All fields present: id (text), name (text), category (text), slideType (text), layersBlueprint (jsonb)
    - Seed script in packages/db/prisma/seed.ts includes TemplateLayout data with idempotency check
  - **Type generation verified**: Prisma types in packages/db/prisma/types.ts include TemplateLayout
---

---
## Iteration 11 - setup-09
- **What was done**: Added BrandKit model to Prisma schema with userId relation
- **Files changed**: 
  - packages/db/prisma/schema.prisma (added BrandKit model)
  - packages/db/prisma/types.ts (generated by Prisma)
  - .ralph/tasks.json (marked task complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **BrandKit model structure**: Successfully added with all required fields:
    - colors (Json with default "{}"), fonts (Json with default "{}"), logoUrl (optional), handle (optional), footerStyle (optional)
    - userId relation with onDelete: Cascade to Profile
    - isDefault flag for setting a default brand kit
    - Standard timestamps (createdAt, updatedAt)
  - **Prisma workflow remains consistent**: 
    - Edit schema.prisma
    - Run `bun db:push` to apply to database
    - Run `bunx prisma generate` to regenerate Kysely types
  - **Relation setup**: Added `brandKits BrandKit[]` array to Profile model to enable bidirectional relation
  - **Index created**: @@index([userId]) for efficient queries by user
  - **Database verification**: Used `docker exec quickcarousals-postgres psql` to verify table structure in PostgreSQL
  - **Working from subdirectory**: When already in packages/db, don't use `cd packages/db &&` prefix - just run commands directly
  - **Type generation**: Prisma Kysely generator automatically updates types.ts with new BrandKit table type
---

---
## Iteration 12 - setup-10
- **What was done**: Added Project model to Prisma schema with ProjectStatus enum and all required relations
- **Files changed**: 
  - packages/db/prisma/schema.prisma (added ProjectStatus enum and Project model)
  - packages/db/prisma/types.ts (generated by Prisma)
  - packages/db/prisma/enums.ts (generated by Prisma)
  - .ralph/tasks.json (marked task complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **Project model structure**: Successfully added with all required fields:
    - title (String), brandKitId (optional String), styleKitId (required String), status (ProjectStatus with DRAFT default)
    - userId relation with onDelete: Cascade to Profile
    - Optional brandKit relation (nullable foreign key)
    - Required styleKit relation
    - Standard timestamps (createdAt, updatedAt)
  - **ProjectStatus enum**: Created with three values: DRAFT, PUBLISHED, ARCHIVED
  - **Multiple relations added**:
    - Added `projects Project[]` to Profile model
    - Added `projects Project[]` to BrandKit model
    - Added `projects Project[]` to StyleKit model
  - **Indexes created**: @@index([userId]), @@index([brandKitId]), @@index([styleKitId]) for efficient queries
  - **Database verification successful**:
    - Verified table structure with `docker exec quickcarousals-postgres psql -U quickcarousals -d quickcarousals -c "\d \"Project\""`
    - Verified enum values with `docker exec quickcarousals-postgres psql -U quickcarousals -d quickcarousals -c "SELECT enumlabel FROM pg_enum WHERE enumtypid = '\"ProjectStatus\"'::regtype ORDER BY enumlabel;"`
    - Note: PostgreSQL enum names are case-sensitive and need double-quote escaping in queries
  - **Type generation**: Both types.ts and enums.ts correctly updated with Project type and ProjectStatus enum
  - **Validation workflow**: Schema grep, database table structure check, and enum verification all passed
---

---
## Iteration 13 - setup-11
- **What was done**: Added Slide model to Prisma schema with all required fields and relations
- **Files changed**: 
  - packages/db/prisma/schema.prisma (added Slide model with relations to Project and TemplateLayout)
  - packages/db/prisma/types.ts (generated by Prisma)
  - .ralph/tasks.json (marked task complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **Slide model structure**: Successfully added with all required fields:
    - orderIndex (Int) - for slide ordering within a project
    - layoutId (String, relation to TemplateLayout) - determines slide layout
    - slideType (String) - categorizes slide purpose (hook, value, CTA, etc.)
    - layers (Json with default "[]") - stores layer configuration as JSON
    - content (Json with default "{}") - stores slide content as JSON
    - projectId relation with onDelete: Cascade to Project
    - Standard timestamps (createdAt, updatedAt)
  - **Bidirectional relations setup**:
    - Added `slides Slide[]` to Project model
    - Added `slides Slide[]` to TemplateLayout model
    - This enables querying slides from both projects and layouts
  - **Indexes created**: @@index([projectId]) and @@index([layoutId]) for efficient queries
  - **JSON default values**: Prisma syntax `@default("[]")` and `@default("{}")` for JSON fields translates to PostgreSQL jsonb with proper defaults
  - **Type generation**: Kysely types in types.ts correctly include Slide table with `unknown` type for JSON fields (this is expected and correct)
  - **Database verification**: Verified table structure with `docker exec quickcarousals-postgres psql` command
  - **Consistent workflow**: Edit schema → `bun db:push` → `bunx prisma generate` → validate → commit
---

---
## Iteration 14 - setup-12
- **What was done**: Added Export model to Prisma schema with ExportType and ExportStatus enums
- **Files changed**: 
  - packages/db/prisma/schema.prisma (added Export model, ExportType enum, ExportStatus enum, updated Project model)
  - packages/db/prisma/types.ts (generated by Prisma)
  - packages/db/prisma/enums.ts (generated by Prisma)
  - .ralph/tasks.json (marked task complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **Export model structure**: Successfully added with all required fields:
    - exportType (ExportType enum: PDF, PNG, THUMBNAIL)
    - status (ExportStatus enum: PENDING, PROCESSING, COMPLETED, FAILED)
    - fileUrl (optional String) - stores the exported file URL
    - errorMessage (optional String) - stores error details if export fails
    - projectId relation with onDelete: Cascade to Project
    - completedAt (optional DateTime) - tracks when export finished
    - Standard createdAt timestamp
  - **Enum definitions**: Created two new enums:
    - ExportType with values: PDF, PNG, THUMBNAIL
    - ExportStatus with values: PENDING, PROCESSING, COMPLETED, FAILED
  - **Bidirectional relation**: Added `exports Export[]` to Project model to enable querying exports from projects
  - **Indexes created**: @@index([projectId]) and @@index([status]) for efficient queries
  - **Prisma workflow remains consistent**: Edit schema → `bun db:push` → `bunx prisma generate` → validate → commit
  - **Database verification**: All tables, enums, and indexes created correctly in PostgreSQL
  - **Type generation**: Both types.ts and enums.ts correctly updated with Export type and new enums
  - **Working from correct directory**: When in packages/db, don't need to `cd packages/db` - just run commands directly
---

---
## Iteration 15 - setup-13
- **What was done**: Created API error handling utilities and Zod validation helpers
- **Files changed**: 
  - apps/nextjs/src/lib/api-error.ts (created shared ApiError class)
  - apps/nextjs/src/lib/validations/api.ts (created Zod validation helpers)
  - apps/nextjs/src/lib/README.md (created comprehensive documentation)
  - .ralph/tasks.json (marked task complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **Health endpoint already existed**: /api/health was created in iteration 2 and was already complete
  - **Error handling pattern**: Created reusable ApiError class with factory methods for common HTTP errors (400, 401, 403, 404, 429, 500)
  - **Validation helpers pattern**: Created four validation functions:
    - `validateBody()` - for JSON request bodies
    - `validateSearchParams()` - for URL query parameters  
    - `validateParams()` - for path parameters
    - `validate()` - for generic data validation
  - **Error response shape**: All errors follow consistent shape with code, message, optional details, and optional requestId
  - **withErrorHandler wrapper**: Created wrapper function to catch and format errors consistently across all API routes
  - **Zod integration**: All validation helpers throw ApiError with formatted Zod issues when validation fails
  - **Documentation is crucial**: Created comprehensive README with examples showing how to use error handling and validation utilities
  - **Next.js API route patterns**: 
    - Use NextResponse.json() for responses
    - Export GET/POST/PATCH/DELETE as named exports
    - Can use `export const runtime = "edge"` for edge functions
  - **Validation workflow**: The task validation commands are REFERENCE EXAMPLES - the health endpoint already existed and was working, just needed to validate it works
  - **Dev server management**: 
    - Start in background: `cd apps/nextjs && bun dev > /tmp/nextjs-dev.log 2>&1 &`
    - Check if running: `lsof -ti:3000`
    - Always wait a few seconds after starting before testing
  - **Working commands for this task**:
    - `curl -s http://localhost:3000/api/health | jq .` - test health endpoint
    - `curl -s http://localhost:3000/api/health | jq -e '.status == "ok"'` - validate specific field
    - `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health` - check HTTP status
---

---
## Iteration 16 - setup-14
- **What was done**: Created withAuth middleware for protected API endpoints
- **Files changed**: 
  - apps/nextjs/src/lib/with-auth.ts (created auth middleware)
  - apps/nextjs/src/app/api/projects/route.ts (created test endpoint)
  - apps/nextjs/src/utils/clerk.ts (updated to allow API routes to handle auth internally)
  - apps/nextjs/src/lib/README.md (added authentication documentation)
  - .ralph/tasks.json (marked setup-14 complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **Clerk middleware redirect issue**: The global Clerk middleware was redirecting unauthenticated API requests instead of allowing them to pass through to route handlers
  - **Solution**: Added check in middleware to allow API routes (`/api/`) to pass through when not authenticated, so `withAuth` can return proper 401 responses
  - **withAuth pattern**: Created reusable middleware helper that:
    - Uses Clerk's `auth()` to get session
    - Returns 401 Unauthorized if no userId found
    - Passes userId in context object to route handler
    - Handles errors gracefully with consistent ApiError format
  - **Testing auth guards**: Use `curl -s -o /dev/null -w '%{http_code}' URL` to verify HTTP status code
  - **Error response format**: Auth errors follow same ApiError shape: `{ error: { code, message, details?, requestId? } }`
  - **Middleware layering**: Global middleware should pass through to route-level auth for API routes to enable proper HTTP status codes (not redirects)
  - **Combined helpers**: Created `withAuthAndErrors` for routes that need both auth and error handling in one wrapper
  - **Documentation important**: Updated lib/README.md with comprehensive examples of withAuth usage
  - **API route structure**: Protected endpoints follow pattern: `export const GET = withAuth(async (req, { userId }) => { ... })`
---

---
## Iteration 15 - infra-01
- **What was done**: Configured Supabase Storage buckets for logos and exports
- **Files changed**: 
  - supabase/create_buckets.sql (SQL migration for storage buckets and RLS policies)
  - apps/nextjs/src/lib/supabase.ts (Supabase client utilities)
  - apps/nextjs/src/lib/storage.ts (storage utility functions)
  - apps/nextjs/src/lib/README.md (added storage documentation)
  - apps/nextjs/package.json (added @supabase/supabase-js)
  - .ralph/tasks.json (marked infra-01 complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **Supabase Storage is already configured**: Project uses local Supabase (not Cloudflare R2) at http://127.0.0.1:54321
  - **Storage bucket creation**: Use SQL INSERT to create buckets, API endpoints are blocked by RLS
  - **Bucket configuration**:
    - `logos` bucket: 5MB limit, images only (png/jpeg/svg/webp)
    - `exports` bucket: 50MB limit, PDFs and PNGs
    - Both buckets are private (public=false)
  - **RLS policies pattern**: Create policies for INSERT, SELECT, and DELETE with user-scoped access using `auth.uid()::text = (storage.foldername(name))[1]`
  - **SQL execution via Docker**: Use `docker exec supabase_db_quick-carousals psql -U postgres -d postgres` to run SQL
  - **Storage utilities created**:
    - `uploadFile()` - Server-side upload with Buffer or Blob
    - `uploadFileFromBrowser()` - Client-side upload with File object
    - `getSignedUrl()` - Generate temporary download URLs (default 24hr expiry)
    - `deleteFile()` - Delete files from storage
    - `listUserFiles()` - List files in user's folder
    - Helper functions: `getUserFilePath()`, `generateUniqueFilename()`
  - **Supabase client patterns**:
    - `createServerClient()` - Uses service role key for privileged operations
    - `createBrowserClient()` - Uses anon key for client-side operations
  - **Environment variables**: All Supabase env vars already configured in .env.local (URL, anon key, service role key)
  - **Validation commands**: Use `grep -rq 'logos\|LOGOS'` to check for bucket references in code
  - **Database verification**: Query `storage.buckets` and `pg_policies` tables to verify configuration
  - **Package installation**: Use `bun add @supabase/supabase-js` from apps/nextjs directory
---

---
## Iteration 17 - infra-02
- **What was done**: Implemented signed URL generation and upload endpoint
- **Files changed**: 
  - apps/nextjs/src/app/api/upload/route.ts (created)
  - .ralph/tasks.json (marked task complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **getSignedUrl utility already existed** from iteration 15 (infra-01) with 24hr default expiry
  - **Import path alias**: This codebase uses `~/` not `@/` for imports - always check tsconfig paths
  - **Upload endpoint pattern**: Created authenticated file upload endpoint with:
    - Form-data parsing (bucket, file, optional filename)
    - Per-bucket validation (file size limits, MIME type restrictions)
    - User-scoped file paths using userId from withAuth context
    - Signed URL generation with 24hr expiry
  - **Bucket configurations validated**:
    - logos: 5MB limit, images only (png/jpeg/svg/webp)
    - exports: 50MB limit, PDFs and PNGs
  - **Authentication testing**: unauthenticated requests correctly return 401 with proper ApiError format
  - **Module resolution error fixed**: Changed imports from `@/lib/*` to `~/lib/*` to match project tsconfig
  - **Dev server hot reload**: After fixing imports, dev server hot-reloaded automatically (no restart needed)
  - **Working validation workflow**:
    - Check route file exists: `test -f apps/nextjs/src/app/api/upload/route.ts`
    - Check utility exists: `grep -q 'getSignedUrl' apps/nextjs/src/lib/storage.ts`
    - Test endpoint: `curl -X POST http://localhost:3000/api/upload` (should return 401)
  - **File upload implementation details**:
    - Convert File to Buffer via arrayBuffer() for server-side upload
    - Use generateUniqueFilename() to avoid collisions
    - Use getUserFilePath() to organize files by userId
    - Upload returns path, then generate signed URL separately
    - Comprehensive error handling for validation and upload failures
---

---
## Iteration 19 - infra-03
- **What was done**: Configured Upstash Redis connection with singleton client pattern
- **Files changed**: 
  - apps/nextjs/src/lib/redis.ts (created Redis client singleton)
  - apps/nextjs/src/lib/README.md (added comprehensive Redis documentation)
  - apps/nextjs/package.json (added @upstash/redis dependency)
  - .ralph/tasks.json (marked task complete)
- **Result**: PASS
- **Learnings for future iterations**:
  - **Upstash Redis uses REST API**: Use `@upstash/redis` package, not `ioredis` or `redis` - it's serverless-friendly
  - **Automatic JSON handling**: Upstash Redis client automatically serializes/deserializes objects - no need for JSON.stringify/parse
  - **Environment variables already configured**: Redis env vars (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) were already in .env.local and .env.example
  - **Singleton pattern for Redis**: Create singleton to reuse connection across application (important for performance and rate limiting)
  - **Retry logic built-in**: Configured 3 retries with exponential backoff (up to 10 seconds) for reliability
  - **Testing Redis connection**: Use `redis.ping()` - should return 'PONG' if connection is successful
  - **Import path alias**: This codebase uses `~/` not `@/` for imports (as confirmed in iteration 17)
  - **Redis client validation**: Created test endpoint temporarily to verify connection, then deleted it after validation
  - **Working Redis test**: 
    ```bash
    curl -s http://localhost:3000/api/redis-test | jq .
    # Should return success: true with connection info
    ```
  - **Common Redis operations**:
    - `redis.set(key, value, { ex: 3600 })` - set with expiration
    - `redis.get<Type>(key)` - get with type safety
    - `redis.del(key)` - delete
    - `redis.incr(key)` - atomic increment
    - `redis.hset(key, object)` - hash set
    - `redis.lpush/rpop` - list operations for queues
  - **Next task dependency**: Redis is now ready for BullMQ configuration in infra-04
---
