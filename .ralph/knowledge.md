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
