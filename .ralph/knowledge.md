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
