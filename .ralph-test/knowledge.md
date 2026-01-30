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


---
## Iteration 3 - Text Generation API

**Files analyzed**:
- apps/nextjs/src/app/api/generate/text/route.ts
- apps/nextjs/src/lib/openai.ts (already analyzed in iteration 2, reviewed for text-specific features)

**Test cases created**: 13 (TC-GENTEXT-001 through TC-GENTEXT-013)

**Key business logic discovered**:
- **Smart Chunking Algorithm**: `calculateOptimalSlideCount()` automatically adapts slide count based on text length
  - Short text (<500 chars): 5-8 slides - *expands* content with context and examples
  - Medium text (500-2000 chars): 8-12 slides - *extracts* key points, maintains flow
  - Long text (2000-6000 chars): 12-15 slides - *condenses* while keeping key insights
  - Very long text (>6000 chars): 15-20 slides - *ruthlessly selective*, skimmability priority
- **Dynamic Prompt Generation**: `createTextPrompt()` generates different AI instructions based on text length
  - Each length category gets specific pacing instructions
  - Short: "Expand core ideas, add context, make valuable"
  - Medium: "Extract key points, maintain structure"
  - Long: "Condense into digestible slides, focus on insights"
  - Very long: "Extract ONLY critical insights, be ruthlessly selective"
- **Flexible Slide Count**: Allows 3-20 slides (vs topic's 8-12) - more flexibility for text conversion
- **User Override**: User can specify slideCount to override auto-calculation
- **Input Validation**: Text must be 10-10,000 characters (much longer range than topic's 1-500)
- **Same AI Pipeline**: Uses identical 3-step process as topic generation:
  1. generateSlidePlan (with text-specific prompt)
  2. generateSlideCopy
  3. selectLayoutsForSlides
- **Brand Kit Support**: Same brand kit attachment logic as topic generation (lines 192-211)
- **Error Handling**: Identical timeout/rate limit/validation error handling as topic generation

**Key differences from Topic Generation**:
1. **Input Type**: Text (10-10,000 chars) vs Topic (1-500 chars)
2. **Slide Count Range**: 3-20 slides vs 8-12 slides
3. **Smart Chunking**: Auto-adapts to text length vs fixed ranges
4. **Prompt Strategy**: Dynamic pacing instructions vs single topic prompt
5. **Use Case**: Converting existing content vs generating from scratch

**Potential bugs noticed**:
1. **No User Tier Validation**: Same issue as topic generation - free tier users can generate unlimited carousels
2. **Text Length Boundary Cases**: Edge cases at exactly 500, 2000, 6000 chars might produce unpredictable slide counts (need to verify which range they fall into)
3. **Auto-calculation vs Manual**: If user manually sets slideCount outside the "optimal" range for text length, AI may struggle to fit content appropriately (e.g., 8000 chars into 5 slides = very dense)
4. **Error Message Generic**: Line 305-306 says "try again with clearer content" but issue might be text length, not clarity
5. **No Deduplication**: If user pastes same text multiple times, no check for duplicate content

**Patterns for other modules**:
- **Smart Adaptation**: calculateOptimalSlideCount is a great pattern for auto-tuning based on input characteristics
- **Dynamic Prompts**: createTextPrompt pattern (different instructions based on context) should be reused elsewhere
- **User Override Pattern**: Allow auto-calculation but let user override - good UX balance
- **Shared AI Pipeline**: Both generation endpoints use identical 3-step pipeline - good code reuse
- **Consistent Error Handling**: Same timeout/rate limit/auth patterns - maintainable

**Codebase patterns discovered**:
- **Text Length-Based Logic**: Multiple conditional branches based on textLength ranges
- **Formula-Based Calculations**: Math formulas for slide count (ceil, max, min combinations)
- **Template Strings for Prompts**: Multi-line template strings for AI instructions
- **Metadata Enrichment**: Response includes textLength in metadata (useful for analytics)

**Additional insights**:
- Text generation is more complex than topic generation due to variable-length input
- The chunking algorithm is sophisticated - balances density, readability, and platform constraints
- Auto-calculation is deterministic (pure function) - same input always produces same output
- Text generation likely has longer processing time for very long text (8000+ chars)
- Brand kit attachment happens after AI generation (same as topic) - doesn't influence content
- Layout selection is identical to topic generation (same function)
---

---
## Iteration 4 - Creation Flow UI

**Files analyzed**:
- apps/nextjs/src/app/[lang]/(dashboard)/create/page.tsx
- apps/nextjs/src/app/api/slides/route.ts
- apps/nextjs/src/hooks/use-subscription.ts

**Test cases created**: 13 (TC-CREATE-001 through TC-CREATE-013)

**Key business logic discovered**:
- **Client-Side Component**: Entire creation flow is client-side ('use client' directive) - React state manages all UI
- **Two Generation Modes**: Topic (1-500 chars) and Text (10-10,000 chars) with mode switching
- **3-Step Generation Flow**: 
  1. AI Generation (POST /api/generate/topic or /api/generate/text) - returns slide data
  2. Project Creation (POST /api/projects) - creates project container
  3. Slide Creation (multiple POST /api/slides in parallel) - saves all slides to DB
  4. Navigation to editor with router.push
- **Real-time Feature Gating**: 
  - Fetches project count from /api/projects on mount to check carousel limits
  - Fetches style kits from /api/style-kits on mount
  - Fetches subscription tier via useSubscription hook
  - Dynamically filters UI options based on tier (style kits, slide count, carousel limit warnings)
- **Style Kit System**: 8 total style kits, 3 free (minimal_clean, bold_modern, elegant_serif), 5 premium (requires Creator/Pro)
- **Subscription Tiers & Limits**:
  - FREE: 3 carousels, 8 slides max, watermark, 3 style kits, 0 brand kits
  - CREATOR: 30 carousels, 15 slides max, no watermark, all 8 style kits, 1 brand kit
  - PRO: unlimited carousels, 20 slides max, no watermark, all 8 style kits, 5 brand kits
- **Input Validation**: 
  - Topic: min 1 char, max 500 chars (client-side maxLength enforcement)
  - Text: min 10 chars, max 10,000 chars (client-side maxLength enforcement)
  - Generate button disabled when input invalid (topic empty or text < 10 chars)
- **Options**:
  - Slide count: dropdown 8-20, filtered by tier max (FREE sees only 8)
  - Tone: 4 options (professional, bold, calm, contrarian), default professional
  - Brand kit toggle: off by default, controls applyBrandKit API parameter
- **Loading State**: 30-60 second AI generation with spinner + pulsing text, button disabled during loading
- **Error Handling**: try-catch for all API calls, errors extracted from response JSON (errorData.error?.message), displayed in red banner

**Potential bugs noticed**:
1. **No Project Ownership Verification**: Slides API (line 52-61) verifies project ownership, but create page doesn't check if user actually owns the project before creating slides - potential race condition if project creation succeeds but returns someone else's project ID
2. **Parallel Slide Creation Race Condition**: Promise.all at line 176 creates all slides in parallel - if one fails, others may succeed, leaving partial carousel (no rollback/transaction)
3. **No Duplicate Generation Prevention**: User can click generate multiple times before first generation completes if they manipulate the disabled state or have slow network
4. **Style Kit Not Found**: If selectedStyleKit ID doesn't exist in database, generation succeeds but project references invalid styleKitId - no validation before API calls
5. **Carousel Limit Check Race Condition**: projectCount is fetched on mount but not refreshed. If user has page open in multiple tabs and creates carousel in one tab, other tab still shows old count - could bypass limit check
6. **No Tier Verification on Backend**: Frontend enforces carousel limits, slide limits, style kit access - but backend APIs don't verify. Savvy user could bypass by manipulating requests.
7. **Error State Not Cleared on Mode Switch**: If user gets error in Topic mode then switches to Text mode, error banner persists until next generation attempt

**Patterns for other modules**:
- **useSubscription Hook Pattern**: Centralized feature gating logic with canUse(), getLimit(), requiresUpgrade() methods - should be used consistently across all features
- **Three-Step API Flow**: Common pattern for complex operations (generate → create container → save details) - good separation of concerns
- **Tier-Based Filtering**: UI dynamically filters options based on tier (styleKits.filter, slideCount dropdown filter) - prevents users from seeing unavailable options
- **Loading State Management**: Single loading boolean + disabled button + spinner + animation - consistent UX for long operations
- **Upgrade Prompts**: Yellow/purple banners with clear messaging and links to /settings/billing - good conversion funnel
- **data-testid Attributes**: Well-placed test IDs on key elements (mode_topic, mode_text, topic_input, generate_button, etc.) - makes testing easier

**Codebase patterns discovered**:
- **Client Component State**: All form state managed with useState (mode, topic, text, slideCount, tone, selectedStyleKit, applyBrandKit, loading, error)
- **useEffect for Data Fetching**: Two useEffect hooks on mount - one for style kits, one for project count
- **useRouter for Navigation**: router.push() for client-side navigation to editor after success
- **Parallel Requests**: Promise.all for creating multiple slides simultaneously
- **Conditional Rendering**: {condition && <Component />} pattern for warnings, errors, upgrade prompts
- **Tailwind Styling**: Extensive use of utility classes, gradients, animations (animate-spin, animate-pulse), hover states, focus states
- **Form Validation**: Client-side only, no <form> element, validation in isValid derived state

**Additional insights**:
- This is the most complex UI component analyzed so far (435 lines)
- Generation can take 30-60 seconds - UX must account for this (loading states, animations, clear feedback)
- Feature gating is everywhere - 3 separate checks: carousel limit, style kit access, slide count limit
- useSubscription hook is critical - it's called by many components and fetches from /api/profile
- No automatic retries on API failures - user must click generate again
- Brand kit toggle doesn't check if user HAS a brand kit - API handles gracefully if none exists
- Project title for topic mode uses metadata.topic, text mode uses generic "Carousel - {date}"
- All API calls use fetch() with JSON.stringify body and error handling
---

---
## Iteration 5 - Editor Canvas Core

**Files analyzed**:
- apps/nextjs/src/components/editor/EditorCanvas.tsx
- apps/nextjs/src/components/editor/LayerRenderer.tsx
- apps/nextjs/src/components/editor/types.ts
- apps/nextjs/src/lib/text-measure.ts

**Test cases created**: 15 (TC-EDCANVAS-001 through TC-EDCANVAS-015)

**Key business logic discovered**:
- **Canvas Technology**: Uses react-konva library (wrapper around Konva.js) for HTML5 Canvas rendering
- **Fixed Canvas Dimensions**: 1080x1350 (LinkedIn portrait format, 4:5 aspect ratio) - NEVER changes
- **Responsive Scaling**: Canvas scales down to fit container using baseScale = min(containerWidth/1080, containerHeight/1350, 1) - never upscales beyond 1:1
- **Zoom System**: 50-200% zoom range on top of base scale. Formula: finalScale = baseScale * (zoom/100)
- **Pan System**: Only enabled when zoom > 100%, disabled during text editing. Uses mouse drag with clientX/Y tracking
- **Inline Text Editing**: Click text box → textarea overlay appears at exact scaled position → edit → blur/escape closes
- **Auto-Fit Text Algorithm**: Uses binary search (O(log n)) to find largest font size where text fits within bounds (min_font to max_font)
- **Text Measurement**: Custom Canvas 2D API-based measurement (text-measure.ts) with word-wrap line breaking
- **Overflow Detection**: Measures text at min_font - if height > layer.position.height, shows red border and Fix with AI button
- **Rewrite Menu**: 4 AI actions (shorter, punchier, examples, reduce_jargon) call /api/rewrite endpoint
- **Fix with AI**: Special rewrite action for overflow - uses 'shorter' with maxWords=12 to aggressively condense
- **Layer Types**: 2 types - background (solid color rect) and text_box (auto-fit text with constraints)
- **Bullet Styles**: text_box supports bulletStyle: 'disc' (• prefix) or 'numbered' (1. 2. 3. prefix)
- **Brand Kit Integration**: Logo renders top-right (940, 20), handle renders bottom-center (540, 1310) with @ prefix
- **Watermark**: Free tier users see "QuickCarousals.com" at (540, 1320) in semi-transparent gray
- **Font Selection**: Headline vs body distinction, brand kit fonts override styleKit fonts if present
- **Content Structure**: Supports both string and string[] (for bullets) - preserved during edit/save cycle

**Potential bugs noticed**:
1. **No Keyboard Shortcuts**: Tooltip says "Cmd+0" for Fit to Screen but keyboard handler not implemented (lines 312-313)
2. **Pan Bounds Not Enforced**: User can pan canvas completely off-screen - no min/max bounds on pan.x, pan.y
3. **Concurrent Rewrite Protection**: Rewrite button disables during request but user could click multiple text boxes and trigger multiple simultaneous rewrites
4. **Overflow Detection Client-Only**: checkIfOverflows returns false on server (line 189) - SSR pages may not show overflow state correctly
5. **Logo CORS Failure**: If brand kit logo fails CORS (useImage 'anonymous' mode), no fallback or error display - just no logo
6. **measureText Error Swallowed**: Auto-fit catch block (line 182-184) swallows errors and uses max_font - could hide serious issues
7. **Empty Slide Handling**: LayerRenderer.layers.map (line 38) will crash if layers is undefined - needs optional chaining or default []
8. **Rewrite Menu Z-Index Conflict**: Menu uses z-index 1000, but other UI elements might conflict (no documented z-index system)
9. **Text Overflow on Mobile**: Overflow detection uses Canvas 2D API - may produce different results on mobile devices with different rendering engines
10. **No Undo/Redo**: Content changes are immediate - no undo stack for text edits (user must rewrite or manually fix mistakes)

**Patterns for other modules**:
- **Canvas-Based Rendering**: react-konva pattern (Stage → Layer → Shape components) should be reused for export/preview
- **Binary Search Auto-Fit**: calculateOptimalFontSize algorithm is excellent for any text-fitting scenario
- **Scale Calculation Pattern**: baseScale + zoom multiplier is clean separation of concerns
- **Overlay UI Pattern**: Positioning editor overlay at scaled canvas coordinates (position * scale + pan) is tricky but works well
- **Loading States**: Spinner + disabled button + text change pattern (lines 459-476) is consistent and clear
- **Error Handling**: try-catch with user-friendly alert() for API failures - but could be improved with toast notifications
- **Conditional Rendering**: {condition && <Component />} pattern used extensively - clean and readable
- **useEffect Dependencies**: Auto-fit useEffect (line 186) has comprehensive deps array - good pattern for derived state
- **Singleton Canvas**: text-measure.ts uses singleton measurementCanvas - good performance optimization

**Codebase patterns discovered**:
- **react-konva Library**: Stage, Layer, Rect, Text, Group, Image components from 'react-konva', Konva types from 'konva'
- **use-image Hook**: 'use-image' library for async image loading with CORS support
- **Canvas 2D API**: Direct canvas.getContext('2d') usage for text measurement (not Konva)
- **Font String Format**: Canvas font string: `${weight} ${fontSize}px ${fontFamily}` (line 51 in text-measure.ts)
- **Line Height**: Multiplier (e.g., 1.2) applied to fontSize to get lineHeightPx
- **Word Wrapping**: Split by /\s+/, measure each word, break lines when exceeding maxWidth
- **TypeScript Discriminated Unions**: Layer type (BackgroundLayer | TextBoxLayer) with 'type' discriminator
- **Ref Types**: useRef<Konva.Stage>(null) for Konva refs, useRef<HTMLDivElement>(null) for DOM refs
- **Konva Events**: onClick, onTap (mobile), onMouseEnter, onMouseLeave on Text components
- **Konva Naming**: 'name' attribute for testing (data-testid equivalent in Konva)

**Additional insights**:
- Editor canvas is the most complex component analyzed so far (707 lines) - combines state management, Canvas API, Konva.js, UI overlays, API calls
- Auto-fit algorithm is sophisticated - binary search finds optimal font in ~7-10 iterations (log2(max_font - min_font))
- Text measurement must run in browser (Canvas 2D API) - can't SSR the auto-fit calculations
- Zoom/pan UX is well-designed - grab cursor, smooth transitions, fit to screen reset
- Rewrite menu is feature-rich but could be extracted to separate component (lines 430-649)
- Overflow detection is critical for export quality - prevents cut-off text in final PDF/PNG
- Brand kit rendering is additive - doesn't replace core slide content, just adds logo/handle on top
- Bullet formatting is rendering-only - not stored in DB, generated on-the-fly from array content
- Canvas coordinates vs screen coordinates conversion is tricky - must account for scale AND pan
- LayerRenderer is pure rendering - all interaction logic lives in EditorCanvas (good separation)
---


---
## Iteration 6 - Editor Controls

**Files analyzed**:
- apps/nextjs/src/components/editor/ThumbnailRail.tsx
- apps/nextjs/src/components/editor/SlideThumbnail.tsx
- apps/nextjs/src/components/editor/ThemeControls.tsx
- apps/nextjs/src/components/editor/LayoutVariantSelector.tsx
- apps/nextjs/src/components/editor/StyleKitSelector.tsx

**Test cases created**: 15 (TC-EDCONTROLS-001 through TC-EDCONTROLS-015)

**Key business logic discovered**:
- **Thumbnail Rail System**: Left sidebar (180px) with scrollable slide previews
  - 3 action buttons: Add (always enabled), Duplicate (disabled if 0 slides), Delete (disabled if ≤1 slide)
  - Drag-and-drop reordering with visual feedback (opacity 0.5 for dragged, blue border for drop target)
  - Mini canvas previews at 10% scale (108x135) using Konva Stage/Layer
  - Active slide indicator: blue background (#e0e7ff), blue border, blue shadow
- **SlideThumbnail Component**: Individual thumbnail rendering
  - 1-indexed numbering displayed (index + 1)
  - Click handler calls onSlideSelect(index) with 0-indexed value
  - Hover effect on inactive thumbnails (gray background #f3f4f6)
  - Mini canvas renders actual slide content via LayerRenderer
- **Theme Controls**: Color, font, and spacing customization
  - **Color Picker**: 3 colors (background, foreground, accent) with dual input (color picker + hex text)
  - **Font Selector**: 5 predefined pairs (Inter, Lora+Inter, Poppins, Source Sans, Roboto Mono)
  - **Spacing Toggle**: Cycles through tight (1.3), normal (1.5), roomy (1.7) line heights
  - All updates call onStyleKitUpdate with immutable spread pattern
- **Layout Variant Selector**: Smart layout filtering
  - Fetches all layouts from /api/layouts on mount
  - Filters by matching slideType (hook, value, recap, cta, etc.)
  - Shows only compatible layouts (same slideType as current slide)
  - 3-column grid with mini previews (8% scale = 86.4x108)
  - Preview shows gray placeholders for text boxes, actual background color
  - Calls onLayoutChange(layoutId, layersBlueprint) on selection
- **Style Kit Selector**: Full theme switching
  - Fetches from /api/style-kits on mount
  - Grouped display: Free (3 kits) and Premium (5 kits) sections
  - 2-column grid with visual previews showing colors, fonts, accent bar
  - Active kit: blue ring/border for free, purple for premium
  - Calls onStyleKitChange(fullKitObject) - entire StyleKit, not just ID
  - Loading state: "Loading style kits..." placeholder

**Potential bugs noticed**:
1. **No Keyboard Shortcut Handlers**: Tooltips mention Cmd+N (add), Cmd+D (duplicate), Delete key but no keyboard event handlers implemented in these components
2. **Layout Selector API Error Handling**: Fetch error is logged (line 41) but component stays in loading state forever if fetch fails - no error UI
3. **Style Kit Selector Empty State**: No fallback if /api/style-kits returns empty array (not isPremium filtered, truly empty)
4. **Drag State Not Cleared on Error**: If onSlideReorder throws error, draggedIndex/dragOverIndex state persists, thumbnail stays semi-transparent
5. **Theme Controls Backdrop Z-Index**: Multiple dropdowns can open simultaneously (color picker + font selector) - no mutual exclusion
6. **Color Validation**: handleColorChange accepts any string, no validation for valid hex codes (e.g., "#zzz" would be accepted)
7. **Font Preview Load Failures**: Font selector assumes all fonts are available, no fallback if Google Fonts fails to load
8. **Layout Selector Race Condition**: Two useEffects (lines 32, 51) both update state - if layouts fetch is slow, might filter before data arrives
9. **Style Kit Preview CORS**: Preview uses inline styles with fontFamily but doesn't handle CORS errors if fonts fail to load
10. **Thumbnail Rail Scroll Position**: Adding/deleting slides doesn't auto-scroll to show new/next slide in viewport

**Patterns for other modules**:
- **Callback Pattern**: All control components use callback props (onSlideSelect, onStyleKitUpdate, etc.) - clean separation between UI and state
- **Optimistic Updates**: Components call callbacks immediately, assume parent will update state - no local loading states
- **Dropdown Pattern**: Button + backdrop + absolute positioned dropdown used consistently (color picker, font selector, layout selector, style kit selector)
- **Backdrop Close**: All dropdowns use fixed inset-0 backdrop with onClick to close - consistent UX
- **Active State Highlighting**: Consistent visual pattern - blue for free/default items, purple for premium
- **Loading States**: All API-fetching components show loading placeholder (layout selector, style kit selector)
- **Inline Styles vs Tailwind**: ThumbnailRail uses inline styles (older component?), others use Tailwind classes
- **Mini Preview Pattern**: Both thumbnail and layout selector use scaled Konva Stage for visual previews
- **Immutable Updates**: All styleKit updates use spread operator {...styleKit, colors: {...styleKit.colors, ...}}
- **Disabled State Pattern**: Consistent opacity: 0.5, cursor: not-allowed for disabled buttons

**Codebase patterns discovered**:
- **Drag-and-Drop State**: draggedIndex, dragOverIndex useState pattern for tracking drag operations
- **Toggle Cycling**: (currentIndex + 1) % array.length for cycling through options (spacing toggle)
- **Filter Then Display**: Fetch all data, then filter client-side (layouts by slideType, style kits by isPremium)
- **API Fetching on Mount**: useEffect with empty deps array [] for fetching reference data
- **Conditional Filtering**: useEffect with dependencies [layouts, currentSlide.layoutId] to refilter when data changes
- **Visual Feedback During Drag**: CSS properties (opacity, borderTop) updated inline during drag events
- **0-Indexed Callbacks, 1-Indexed Display**: Internal logic uses 0-based indices, UI shows 1-based numbering
- **Konva for Thumbnails**: react-konva Stage/Layer used for all canvas previews (thumbnails, layout previews)
- **Data-Testid Pattern**: All interactive elements have data-testid attributes for E2E testing

**Additional insights**:
- Editor controls are separate components - modular design allows reuse
- No direct canvas manipulation - all changes go through parent component callbacks
- Theme controls update entire styleKit object, not individual properties
- Layout selector filtering prevents incompatible layout selection (UX safeguard)
- Style kit switching is the most powerful single action - changes colors, fonts, spacing instantly
- Thumbnail rail is the primary navigation UI - must be reliable
- Drag-and-drop adds complexity but provides intuitive reordering UX
- All dropdowns use z-index stacking (z-10 for backdrop, z-20 for dropdown)
- Loading states are important - API calls can take 500-1000ms
- Mini previews are resource-intensive (Konva rendering) but provide valuable visual feedback
---

## 🔴 Potential Issues Noticed (Updated)

| Module | Issue Type | Description |
|--------|-----------|-------------|
| editor_controls | Low | No Keyboard Shortcut Handlers - Tooltips mention Cmd+N (add), Cmd+D (duplicate), Delete key but no keyboard event handlers implemented in these components |
| editor_controls | Medium | Layout Selector API Error Handling - Fetch error logged but component stays in loading state forever if fetch fails, no error UI shown |
| editor_controls | Low | Style Kit Selector Empty State - No fallback if /api/style-kits returns empty array (not isPremium filtered, truly empty) |
| editor_controls | Medium | Drag State Not Cleared on Error - If onSlideReorder throws error, draggedIndex/dragOverIndex state persists, thumbnail stays semi-transparent |
| editor_controls | Low | Theme Controls Backdrop Z-Index - Multiple dropdowns can open simultaneously (color picker + font selector), no mutual exclusion |
| editor_controls | Medium | Color Validation - handleColorChange accepts any string, no validation for valid hex codes (e.g., "#zzz" would be accepted) |
| editor_controls | Low | Font Preview Load Failures - Font selector assumes all fonts are available, no fallback if Google Fonts fails to load |
| editor_controls | Medium | Layout Selector Race Condition - Two useEffects (lines 32, 51) both update state, if layouts fetch is slow might filter before data arrives |
| editor_controls | Low | Style Kit Preview CORS - Preview uses inline styles with fontFamily but doesn't handle CORS errors if fonts fail to load |
| editor_controls | Medium | Thumbnail Rail Scroll Position - Adding/deleting slides doesn't auto-scroll to show new/next slide in viewport |


---
## Iteration 7 - Editor Page Integration

**Files analyzed**:
- apps/nextjs/src/app/[lang]/(dashboard)/editor/[id]/page.tsx (347 lines)
- apps/nextjs/src/app/[lang]/(dashboard)/editor/test/page.tsx (670 lines)
- apps/nextjs/src/app/api/projects/[id]/route.ts (176 lines)
- apps/nextjs/src/app/api/projects/[id]/slides/route.ts (162 lines)

**Test cases created**: 15 (TC-EDPAGE-001 through TC-EDPAGE-015)

**Key business logic discovered**:
- **Page Architecture**: Editor page is the integration hub - orchestrates ThumbnailRail, EditorCanvas, StyleKitSelector, ThemeControls, LayoutVariantSelector, ExportModal
- **Complex Data Loading**: 4-step sequential load: project → slides → style kit → layouts, with data transformation to SlideData format
- **Data Transformation Pipeline**: Raw DB data (JSON strings) → parsed content objects → enriched with styleKit/layersBlueprint → SlideData type
- **State Management**: Central state in editor page, passed down via props, callbacks bubble up changes (classic React unidirectional data flow)
- **Auto-Save Integration**: useAutoSave hook with 500ms debounce, tracks slides state changes, skips initial mount, handles PUT /api/projects/:id/slides
- **Active Slide Pattern**: Single activeSlideIndex state controls ALL coordinated updates across components (ThumbnailRail highlight, Canvas content, Controls data)
- **Slide Operations**: 5 operations (Add, Duplicate, Delete, Reorder, ContentChange) all update slides array immutably, trigger auto-save
- **Temp ID Pattern**: New/duplicated slides get 'temp-{timestamp}' IDs, backend skips them until content edited (saves API calls)
- **Error Handling**: 3 states (loading, error, empty) with specific UI for each, graceful degradation with clear user actions
- **Test Page Pattern**: Isolated /editor/test page with sample data, mock API calls, useful for component development without database

**Potential bugs noticed**:
1. **No Keyboard Shortcuts**: Editor page doesn't implement keyboard shortcuts mentioned in tooltips/test page (Cmd+E, Cmd+S, Cmd+D, Delete, Cmd+0, Cmd++, Cmd+-)
2. **Layout Change Missing layersBlueprint**: handleLayoutChange (line 193) only updates layoutId, doesn't update layersBlueprint - EditorCanvas must re-fetch or derive it
3. **No Confirmation on Navigation**: Back button (line 264) navigates without checking if auto-save is in-progress - could lose data if save is still running
4. **Race Condition on Fast Navigation**: If user navigates away before auto-save completes (500ms debounce + network time), changes may be lost
5. **Content Parsing Error Swallowed**: Line 103 JSON.parse(slide.content) could fail for corrupted data, would crash page instead of showing error state
6. **No Loading State for Save**: Header shows save status but no visual feedback DURING the PUT request (only after response)
7. **StyleKit Fetch Failure**: If GET /api/style-kits/:id fails (line 87-90), error shows generic 'Failed to load style kit' instead of 'Failed to load project'
8. **Empty Content Defaults**: Slide transformation (lines 112-115) uses empty strings/arrays as defaults, could cause issues if layers expect specific content structure
9. **No Optimistic Updates**: All operations wait for state update → auto-save → backend response, no optimistic UI updates during save
10. **Test Page API Calls**: Test page mock save logs to console (line 230), but components might still make real API calls (styleKits, layouts) unless mocked

**Patterns for other modules**:
- **Integration Hub Pattern**: Top-level page component owns state, coordinates all child components via props/callbacks
- **4-Step Data Load**: Fetch project metadata → fetch related data → enrich/transform → render (good pattern for complex data requirements)
- **Temp ID Pattern**: Use 'temp-{timestamp}' for client-side entities, backend ignores them, useful for optimistic UI
- **Active Index Coordination**: Single source of truth (activeSlideIndex) synchronizes multiple views (thumbnails, canvas, controls)
- **Auto-Save with Debounce**: useAutoSave hook pattern (debounce + initial mount guard) prevents excessive API calls
- **State Callback Cascade**: Parent component handlers (handleSlideAdd, handleStyleKitChange, etc.) update state, children re-render automatically
- **Loading/Error/Empty States**: 3-state pattern with specific UI for each, clear user actions (Back to Dashboard button)
- **Test Page for Development**: Isolated test page with sample data, no API dependencies, useful for component testing

**Codebase patterns discovered**:
- **Client Component Pattern**: 'use client' directive at top, all hooks/state in client component, Server Component data fetching in parent if needed
- **useParams for Route Params**: Next.js useParams hook to extract [id] from URL path
- **useEffect for Data Loading**: Single useEffect (lines 67-132) with comprehensive try-catch, sets loading/error/data states
- **isInitialMount Guard**: useRef to track first render, prevent auto-save on initial load (lines 55-60)
- **Immutable State Updates**: All state updates use spread operator or .map to create new arrays/objects (lines 136-150, 189-191, 193-202)
- **Array.splice for Reordering**: Destructuring + splice pattern for reordering: `const [moved] = newSlides.splice(fromIndex, 1); newSlides.splice(toIndex, 0, moved)` (lines 183-184)
- **Conditional Rendering**: Multiple early returns for loading/error/empty states before main render (lines 210-255)
- **data-testid Attributes**: Export button has data-testid='export_button' for E2E testing
- **Three-Column Layout**: Fixed-width sidebars (180px left, 320px right), flex-1 center canvas, overflow-hidden to prevent scroll leaks

**Additional insights**:
- Editor page is the most complex integration point analyzed so far (347 lines, 5 child components, 4 API calls, 12 handlers)
- State management is centralized - no prop drilling beyond one level, clean component hierarchy
- Auto-save is aggressive (500ms debounce) but smart (skips initial mount, skips temp slides, includes orderIndex)
- Test page (/editor/test) is excellent for development - has 6 sample slides showing different layouts, overflow test, full component integration
- Data transformation (lines 101-118) is critical - converts DB format to component-friendly SlideData type
- Backend slide saving uses bulk PUT (not individual PATCH per slide) - efficient but no partial rollback if one fails
- Temp ID pattern prevents saving incomplete slides but requires backend to handle gracefully (line 126 in slides/route.ts)
- Active slide coordination is fragile - many components depend on activeSlideIndex being in sync
- No undo/redo stack - users rely on auto-save for recovery, no manual revert capability
- Component composition is clean - each child has single responsibility, callbacks for actions
---


---
## Iteration 8 - Export System

**Files analyzed**:
- apps/nextjs/src/app/api/exports/route.ts
- apps/nextjs/src/app/api/exports/[id]/route.ts
- apps/nextjs/src/lib/render-slide.ts
- apps/nextjs/src/lib/generate-pdf.ts
- apps/nextjs/src/lib/queues/render-queue.ts
- apps/nextjs/src/lib/queues/render-worker.ts
- apps/nextjs/src/components/editor/ExportModal.tsx
- apps/nextjs/src/lib/storage.ts

**Test cases created**: 16 (TC-EXPORT-001 through TC-EXPORT-016)

**Key business logic discovered**:
- **Export Pipeline**: 4-stage asynchronous flow:
  1. **API Entry (POST /api/exports)**: Validates project ownership, creates Export record with PENDING status, queues BullMQ job
  2. **Queue Processing**: BullMQ manages job queue with Redis backend, supports retry with exponential backoff (3 attempts, 5s base delay)
  3. **Worker Rendering**: Background worker fetches slide data, renders to PNG/PDF using @napi-rs/canvas (Skia-based), uploads to Supabase Storage
  4. **Status Polling (GET /api/exports/[id])**: Frontend polls every 2s for status updates, receives signed download URLs when complete
- **Export Types**: 3 types supported:
  - **PDF**: Multi-page PDF (1080x1350 per page), all slides in one file, best for LinkedIn
  - **PNG**: Individual PNG images (one per slide), stored as JSON array of URLs in fileUrl
  - **THUMBNAIL**: Single PNG of first slide only, used for project covers on dashboard
- **ExportModal UI**: Two-screen flow:
  - **Configuration Screen**: Format selection (PDF/PNG buttons), filename input, cover thumbnail checkbox, Start Export button
  - **Progress Screen**: Real-time status polling, progress bar (PENDING 25%, PROCESSING 75%), download button(s) on completion
- **Server-Side Rendering**: Uses @napi-rs/canvas (Node.js binding to Skia) for consistent, high-quality rendering:
  - Canvas dimensions: 1080x1350 (LinkedIn portrait format, never scaled)
  - Auto-fit text algorithm: Binary search (O(log n)) finds largest font size that fits within bounds
  - Text measurement: Canvas 2D API with word-wrap line breaking
  - Font loading: Attempts to load custom fonts, falls back to system fonts if unavailable
- **PDF Generation**: Uses PDFKit library to create multi-page PDFs from PNG buffers
  - Each slide rendered to PNG first, then added as full-bleed image on PDF page
  - PDF dimensions match canvas (1080x1350 points at 72 DPI)
  - Pages added sequentially, no margins or padding
- **Storage & Downloads**:
  - Files uploaded to Supabase Storage 'exports' bucket with path: userId/filename
  - Signed URLs generated for secure downloads (24-hour expiry)
  - PNG exports return array of signed URLs (one per slide)
  - Download triggered via hidden anchor element with programmatic click
- **Watermark Logic**: Free tier enforcement:
  - Worker fetches user's subscriptionTier from Profile table
  - FREE tier: showWatermark = true, text "QuickCarousals.com" rendered at (540, 1320) in rgba(0,0,0,0.4)
  - CREATOR/PRO tier: showWatermark = false, no watermark applied
  - Watermark applied to ALL export types (PDF, PNG, THUMBNAIL)
- **Error Handling**:
  - Job failures update Export.status = FAILED with errorMessage
  - BullMQ retries up to 3 times with exponential backoff (5s, 10s, 20s)
  - Transient errors (network, timeout) may succeed on retry
  - Frontend displays error banner on FAILED status, polling stops
  - Signed URL generation failures don't crash request (line 99-102 in exports/[id]/route.ts)

**Potential bugs noticed**:
1. **No Retry for Signed URL Failures**: exports/[id]/route.ts catches signed URL errors but doesn't fail request - sets errorMessage and continues, client should retry but no automatic mechanism
2. **No Progress Percentage**: Export status only has 4 states (PENDING/PROCESSING/COMPLETED/FAILED), no progress % or current slide count - hard to estimate completion time for 15+ slide carousels
3. **Font Cache Doesn't Persist Across Worker Restarts**: registeredFonts Set (render-slide.ts line 21) caches fonts in-memory but doesn't persist, causing repeated font loading on worker restart
4. **No Export Cancellation**: Once job queued, user cannot cancel - modal has no cancel button during PROCESSING, job completes even if modal closed
5. **Test Mode Simulation Incomplete**: ExportModal lines 52-68 simulate test exports but only handle basic PDF flow, no PNG array URLs or FAILED scenarios
6. **Worker Concurrency Hardcoded**: render-worker.ts line 350 has concurrency: 2 hardcoded, cannot configure via env var - may be too low for high-traffic or too high for low-resource servers
7. **No Batch Export**: Users must export projects one at a time, no API/UI for bulk exporting multiple carousels

**Patterns for other modules**:
- **Background Job Pattern**: POST API creates record → queues job → worker processes asynchronously → status polling for updates. Good for long-running tasks (10-60s).
- **BullMQ Queue Setup**: Queue with Redis connection, retry config (attempts, backoff), job cleanup (removeOnComplete, removeOnFail), singleton pattern for queue instance
- **Worker Pattern**: Worker with processJob function, event handlers (completed, failed, error), graceful shutdown (SIGTERM/SIGINT), separate Redis connection
- **Polling Pattern**: useEffect with setInterval, clearInterval on completion/unmount, 2-second interval for balance between responsiveness and API load
- **Binary Search Auto-Fit**: Efficient algorithm for text fitting - O(log n) iterations to find optimal font size within min/max bounds
- **Signed URL Security**: Private storage buckets with time-limited signed URLs (24h expiry) for secure downloads without exposing storage credentials
- **Two-Screen Modal**: Configuration screen → progress screen transition, disable back navigation during processing, close modal resets all state
- **Server-Side Canvas**: @napi-rs/canvas for Node.js rendering, consistent output across environments, no browser dependencies

**Codebase patterns discovered**:
- **BullMQ Library**: Queue and Worker classes from 'bullmq', IORedis for connection, job options (priority, jobId, attempts, backoff)
- **@napi-rs/canvas**: createCanvas, GlobalFonts, SKRSContext2D, loadImage - Skia-based canvas for Node.js
- **PDFKit Library**: PDFDocument for PDF generation, addPage, image insertion, stream-based output with chunks
- **Supabase Storage API**: createClient().storage.from(bucket).upload/createSignedUrl/remove, public vs signed URLs
- **Export Schema Validation**: Zod schema with enum for exportType: ['PDF', 'PNG', 'THUMBNAIL']
- **Job Data Structure**: RenderJobData interface with projectId, exportId, exportType, userId, slideIds
- **Status Enum**: ExportStatus type = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
- **Font Registration**: GlobalFonts.registerFromPath(fontPath, fontFamily), Set for cache tracking
- **Canvas Text API**: ctx.font, ctx.fillStyle, ctx.textAlign, ctx.fillText, ctx.measureText for text rendering
- **Line Breaking Algorithm**: Split text by spaces, accumulate words until width exceeds maxWidth, break line
- **Programmatic Download**: createElement('a'), set href/download, appendChild, click(), removeChild

**Additional insights**:
- Export system is the most complex background processing analyzed - combines API, queue, worker, storage, and real-time polling
- BullMQ provides production-ready job queue with Redis persistence, retry logic, and job cleanup - much better than in-memory queues
- @napi-rs/canvas ensures consistent rendering across environments (dev, staging, production) - Skia-based, not browser-dependent
- Watermark is critical monetization feature - enforced server-side so free users cannot bypass
- Signed URLs provide security without exposing storage credentials - 24h expiry balances convenience and security
- Binary search auto-fit algorithm is sophisticated - typically converges in 7-10 iterations for font range 12-80px
- ExportModal handles test mode for development (lines 52-68) - useful for testing without real exports
- Worker concurrency of 2 is conservative - balances throughput and resource usage, may need tuning for production scale
- Export status polling every 2s is reasonable - not too aggressive (server load) but still feels responsive to users
- PDF generation is two-step: render slides to PNG → insert PNGs into PDF pages - allows reuse of PNG rendering logic
- Storage path pattern (userId/filename) provides natural organization and isolation - all user's files in one folder
- Font fallback logic prevents export failures due to missing fonts - degrades gracefully rather than failing hard
---

---
## Iteration 9 - Project CRUD APIs

**Files analyzed**:
- apps/nextjs/src/app/api/projects/route.ts
- apps/nextjs/src/app/api/projects/[id]/route.ts
- apps/nextjs/src/app/api/projects/[id]/slides/route.ts

**Test cases created**: 13 (TC-PROJCRUD-001 through TC-PROJCRUD-013) - already existed, task completion status updated

**Key business logic discovered**:
- **Authentication**: All endpoints protected by `withAuthAndErrors` middleware - requires valid Clerk session
- **Profile Lookup Pattern**: Every request converts Clerk's `userId` to internal `Profile.id` via database query (SELECT id FROM Profile WHERE clerkUserId = userId)
- **Ownership Verification**: ALL operations verify project belongs to user (WHERE userId = profile.id) - strong security enforcement
- **CRUD Operations**:
  - **GET /api/projects**: List all user's projects ordered by updatedAt desc
  - **POST /api/projects**: Create project with title, styleKitId, optional brandKitId
  - **GET /api/projects/:id**: Get single project by ID (with ownership check)
  - **PATCH /api/projects/:id**: Update title, styleKitId, brandKitId, status
  - **DELETE /api/projects/:id**: Delete project (cascades to slides automatically)
- **Slides Sub-Resource**:
  - **GET /api/projects/:id/slides**: List all slides ordered by orderIndex asc
  - **PUT /api/projects/:id/slides**: Bulk update all slides in one request
- **Foreign Key Validation**:
  - POST verifies styleKitId exists in StyleKit table (lines 89-97)
  - POST verifies brandKitId exists AND belongs to user (lines 100-111) - can't reference other users' brand kits
- **Bulk Slide Update**: PUT /slides uses Promise.all to update slides in parallel (line 124-143)
- **Temp Slide Handling**: Slides with IDs starting with 'temp-' are skipped during updates (line 126) - allows frontend optimistic UI
- **Cascade Delete**: Project deletion automatically removes all slides (database cascade, no explicit DELETE query needed)
- **Update Pattern**: PATCH builds dynamic update object, only includes fields that are present in request body (lines 111-118)

**Potential bugs noticed**:
1. **No Transaction Wrapping**: Bulk slide update uses Promise.all without transaction - if one slide fails, others succeed, leaving inconsistent state
2. **No Slide Count Limit**: PUT /slides accepts unlimited slides array - no validation that slide count matches user's tier limits
3. **Status Enum Not Validated**: PATCH accepts status enum but doesn't verify transitions are valid (e.g., can go from ARCHIVED back to DRAFT without business logic validation)
4. **Empty Slides Array**: PUT /slides doesn't handle empty slides array - would succeed but do nothing, might be unintended
5. **Project Ownership Check Redundancy**: Slides GET/PUT both check project ownership (lines 48-57, 112-120) - duplicated logic across endpoints
6. **No Soft Delete**: DELETE permanently removes project and slides - no soft delete or archive functionality (unrecoverable)
7. **URL Parsing**: Manual URL parsing (url.pathname.split('/')) is fragile - Next.js params should be used instead

**Patterns for other modules**:
- **withAuthAndErrors Pattern**: Consistent wrapper for all API routes - provides userId, handles errors, returns proper status codes
- **Profile Lookup Pattern**: Convert Clerk userId → Profile.id at start of every request - centralized pattern across all API routes
- **Ownership Verification Pattern**: WHERE clauses on user-owned resources always include userId check - prevents unauthorized access
- **Zod Validation Pattern**: validateBody() helper with Zod schemas for all POST/PATCH/PUT requests
- **Kysely Query Pattern**: Type-safe database queries with selectFrom/where/select/execute chains
- **Bulk Update Pattern**: Promise.all for parallel operations on multiple records
- **Foreign Key Validation**: Explicit EXISTS checks before insert to provide better error messages than database constraint violations
- **Dynamic Update Object**: Build update object conditionally based on present fields - flexible API that only updates what's provided

**Codebase patterns discovered**:
- **API Response Pattern**: 200 for GET/PATCH, 201 for POST, 200 with { success: true } for DELETE
- **Error Propagation**: if (error.statusCode) throw error - propagates ApiErrors without wrapping
- **Timestamp Management**: createdAt set on INSERT, updatedAt set on INSERT and UPDATE
- **JSON Column Handling**: content and layers are JSON columns - use JSON.stringify() on write, parse on read
- **Project Status Enum**: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' - default is 'DRAFT'
- **Slide OrderIndex**: Integer field for deterministic ordering, set during bulk update (line 135)
- **returningAll() Pattern**: Kysely's returningAll() returns inserted/updated record - useful for API responses
- **executeTakeFirst() vs executeTakeFirstOrThrow()**: takeFirstOrThrow() throws on empty result, takeFirst() returns undefined

**Additional insights**:
- Project CRUD APIs are well-designed with strong security (ownership checks on every operation)
- No ability to list/access other users' projects - complete data isolation
- Bulk slide update is efficient (single API call) but lacks transactional safety
- Foreign key validation provides better UX than database constraint errors
- Temp slide pattern (frontend creates 'temp-' IDs) allows optimistic UI without backend round-trips
- Cascade delete is configured at database level (Prisma schema onDelete: Cascade) - not in API code
- Profile lookup is repeated in every request - potential optimization would be middleware that adds Profile.id to context
- All test cases already created in previous iteration - task was to verify and mark complete
---

---
## Iteration 10 - Dashboard Module

**Files analyzed**:
- apps/nextjs/src/app/[lang]/(dashboard)/dashboard/page.tsx (135 lines)
- apps/nextjs/src/app/[lang]/(dashboard)/dashboard/layout.tsx (75 lines)
- apps/nextjs/src/components/empty-placeholder.tsx (79 lines)
- apps/nextjs/src/components/header.tsx (23 lines)
- apps/nextjs/src/components/shell.tsx (33 lines)

**Test cases created**: 8 (TC-DASH-001 through TC-DASH-008)

**Key business logic discovered**:
- **Client-Side Component**: Dashboard page is 'use client' - all data fetching happens in browser via useEffect
- **Single API Call**: Fetches projects from GET /api/projects on mount, no pagination or filtering
- **3 UI States**: Loading (skeleton), Empty (no projects), Populated (project grid)
- **Loading Skeleton**: Shows 6 placeholder cards with animate-pulse during initial fetch
- **Project Display**: Responsive grid layout (1 col mobile, 2 md, 3 lg) with Card components
- **Project Card Data**: Shows title (line-clamp-2), status badge, last updated date (formatted MMM DD, YYYY)
- **Status Badge System**: 3 status values with color coding:
  - DRAFT → yellow badge (bg-yellow-100, text-yellow-800)
  - PUBLISHED → green badge (bg-green-100, text-green-800)
  - ARCHIVED → gray badge (bg-gray-100, text-gray-800)
- **Card Hover State**: Border/shadow/text color changes on hover with transition-all duration-200
- **Empty State Component**: Appears when projects.length === 0 after loading completes
  - Sparkles icon in gradient circle
  - "No carousels yet" heading
  - Encouragement text ("It only takes 3 minutes!")
  - CTA button "Create Your First Carousel" linking to /create
  - Min-height 450px, dashed border, fade-in animation
- **Layout Pattern**: Server Component layout wraps Client Component page
  - Layout enforces auth (getCurrentUser() → redirect if null)
  - Layout provides: sticky header, sidebar (md+), main content area, footer
  - Header includes: MainNav, LocaleChange, UserAccountNav with user details
  - Sidebar: 200px width, DashboardNav items (hidden on mobile)
- **Navigation**: Two primary CTAs - "New Carousel" button in header, cards link to /editor/{id}
- **Date Formatting**: Uses Intl.DateTimeFormat via toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
- **Error Handling**: Catch block logs to console but doesn't show user-facing error message

**Potential bugs noticed**:
1. **No User-Facing Error Message**: If API fails, error logged to console but user sees empty state (might confuse users who had projects) - no error banner/toast
2. **No Retry Mechanism**: If initial fetch fails, user must refresh entire page to retry - no "Retry" button or automatic retry
3. **Loading State Not Cancelled on Navigation**: If user navigates away during loading, fetch continues in background (no AbortController cleanup)
4. **Date Formatting Hardcoded to en-US**: formatDate function always uses 'en-US' locale (line 46) instead of respecting dynamic lang param from route
5. **No Project Sorting UI**: Projects displayed in API order (updatedAt desc) but no UI to change sort order (by title, created date, status)
6. **No Pagination**: Fetches ALL user projects at once - could be slow for users with 100+ projects
7. **No Search/Filter**: No way to search by title or filter by status - becomes unusable with many projects

**Patterns for other modules**:
- **useEffect Data Fetching Pattern**: Fetch on mount with try-catch-finally, set loading/data/error states
- **Three-State UI Pattern**: Loading → (Empty | Populated) - clean conditional rendering with ternary operators
- **Loading Skeleton Pattern**: Show N placeholder cards matching actual layout - prevents layout shift
- **Empty State Pattern**: Icon + Heading + Description + CTA button - clear guidance for users
- **Card Grid Pattern**: Responsive grid with hover effects - consistent UX across viewport sizes
- **Status Badge Pattern**: Color-coded badges with enum mapping - visual status indicators
- **Server Layout + Client Page Pattern**: Auth/data protection in layout (Server), interactions in page (Client)
- **data-testid Attributes**: Strategic placement on key elements (new_project_button, empty_state, dashboard_projects) for E2E testing

**Codebase patterns discovered**:
- **Client Component useState Pattern**: Multiple useState hooks for projects, loading state management
- **useEffect with Empty Deps**: Single useEffect with [] deps for mount-only data fetching
- **Async Function Inside useEffect**: Define async fetchProjects(), call it immediately (line 27-41)
- **Array.map for Lists**: projects.map((project) => ...) for rendering project cards
- **Conditional Rendering Chains**: loading ? <Loading /> : projects.length > 0 ? <Grid /> : <Empty />
- **Next.js Link Wrapping**: <Link href={...}><Component /></Link> pattern for client-side navigation
- **Tailwind Responsive Classes**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for breakpoint-based layout
- **Compound Components**: EmptyPlaceholder.Icon, EmptyPlaceholder.Title, EmptyPlaceholder.Description
- **Server Component Auth Pattern**: await getCurrentUser() in layout, redirect() if null (line 29-33)
- **generateStaticParams Pattern**: Export function for static generation of locale-based routes (line 21-23)
- **Card Component Composition**: Card > CardHeader > CardTitle/CardDescription, CardContent structure

**Additional insights**:
- Dashboard is simpler than expected - no complex state management, just fetch-and-display
- Empty state is well-designed - friendly messaging, clear CTA, encourages action
- Loading skeleton is thoughtful - shows 6 cards (enough to fill viewport) with realistic structure
- Status badges use Tailwind's color palette consistently - good visual hierarchy
- Layout auth check happens at layout level (Server Component) - ensures protection before any client code runs
- No direct project manipulation on dashboard (no delete, archive, duplicate buttons) - keeps UI clean and simple
- Date formatting could be improved to respect user's locale preference (currently hardcoded en-US)
- Performance could be concern for power users with 100+ projects (no pagination/virtualization)
- Empty state appears for both "no projects" and "API error" scenarios - might confuse users in error case
---


---
## Iteration 11 - Brand Kit Module

**Files analyzed**:
- apps/nextjs/src/app/api/brand-kits/route.ts (GET /api/brand-kits, POST /api/brand-kits)
- apps/nextjs/src/app/api/brand-kits/[id]/route.ts (PATCH, DELETE for individual kits)
- apps/nextjs/src/app/[lang]/(dashboard)/settings/brand-kit/page.tsx (Settings UI)
- apps/nextjs/src/lib/storage.ts (Supabase Storage utilities)
- packages/db/prisma/schema.prisma (BrandKit model)

**Test cases created**: 14 (TC-BRANDKIT-001 through TC-BRANDKIT-014)

**Key business logic discovered**:
- **Brand Kit Structure**: Personal branding assets including logo, colors (primary/secondary/accent), fonts (headline/body), handle (@username), footerStyle, isDefault flag
- **Tier Limits**: FREE: 0 brand kits, CREATOR: 1 brand kit, PRO: 5 brand kits (from use-subscription.ts)
- **CRUD Operations**: Full CRUD via REST APIs - GET list, POST create, PATCH update, DELETE remove
- **Dual Request Format Support**: Both JSON and multipart/form-data supported for create/update (multipart for logo upload)
- **Logo Upload System**: 
  - Uploads to Supabase Storage 'logos' bucket
  - Path pattern: {userId}/{sanitizedName}-{timestamp}.{extension}
  - File validation: PNG, JPEG, SVG, WebP only, max 5MB
  - Unique filename generation with timestamp to prevent collisions
  - Old logo deletion before uploading new one (graceful error handling)
- **isDefault Flag Behavior**: Setting brand kit as default automatically unsets all other user's brand kits (lines 147-153 in route.ts, 162-169 in [id]/route.ts)
- **Data Isolation**: All operations verify ownership via Profile.clerkUserId → Profile.id lookup, WHERE userId = profile.id on all queries
- **Storage Integration**: uploadFile, deleteFile, getUserFilePath, generateUniqueFilename utilities from storage.ts
- **Settings UI Features**:
  - Load all user's brand kits on mount, display as button list
  - First kit auto-loads into form
  - Switch between kits via button clicks
  - Real-time preview card showing brand appearance
  - Create new vs update existing (determined by selectedKitId)
  - Delete with confirmation dialog
  - Dual color input: color picker + hex text
  - Logo preview with FileReader
  - 5 font options: Inter, Lora, Poppins, Source Sans Pro, Roboto Mono

**Potential bugs noticed**:
1. **No Tier Limit Enforcement on Backend**: Frontend may gate brand kit creation by tier, but backend APIs don't check subscription tier - users could bypass limit by manipulating requests
2. **Logo URL Parsing May Fail**: Lines 129-134 in [id]/route.ts extract path from logoUrl by splitting URL - could fail if URL format changes or is malformed
3. **No Logo Preview CORS Handling**: Frontend logo preview (page.tsx lines 249-256, 432-440) doesn't handle CORS errors if logo URL fails to load
4. **isDefault Race Condition**: If two requests set isDefault=true simultaneously, both could succeed before either updates other kits - may result in multiple default kits
5. **No Brand Kit Usage Check**: DELETE doesn't verify if brand kit is currently in use by projects - deleting could break existing carousels using that kit
6. **Form State Not Validated**: handleSave (page.tsx line 86-89) only checks name.trim() - doesn't validate colors are valid hex codes or fonts are in allowed list
7. **No Graceful Degradation for Storage Failures**: If Supabase Storage is down, API fails hard - no fallback or partial success
8. **Logo File Size Only Checked on Upload**: Large logo files in existing kits may cause performance issues when rendering carousels - no validation on retrieval

**Patterns for other modules**:
- **Dual Format API Pattern**: Support both JSON and multipart/form-data in same endpoint using contentType header check (lines 85-144 in route.ts)
- **verifyOwnership Helper Pattern**: Reusable helper function (lines 38-63 in [id]/route.ts) for ownership checks - should be used consistently
- **isDefault Toggle Pattern**: Automatically unset flag on all other records when setting one as default - good for singleton selection
- **Graceful Storage Cleanup**: Log warnings but continue operation if storage deletion fails (lines 136-139, 219-221 in [id]/route.ts)
- **Logo Preview Pattern**: FileReader.readAsDataURL for client-side preview before upload (page.tsx lines 77-81)
- **Real-time Preview Pattern**: Preview card with inline styles driven by state - updates immediately on change (lines 401-443)
- **Kit Selector Pattern**: Display list of existing items as buttons, active item highlighted, load selected into form (lines 189-211)
- **Unique Filename Pattern**: Sanitize + timestamp + original extension for collision-free storage (storage.ts lines 185-191)

**Codebase patterns discovered**:
- **Supabase Storage API**: uploadFile, deleteFile, getPublicUrl, createSignedUrl from storage utilities
- **STORAGE_BUCKETS Constant**: Centralized bucket names ('logos', 'exports') in storage.ts lines 15-18
- **FormData Parsing**: Extract form fields, parse JSON strings for nested objects (colors, fonts)
- **File Buffer Conversion**: Buffer.from(await file.arrayBuffer()) for Node.js storage upload (route.ts line 130)
- **URL Path Extraction**: new URL(logoUrl).pathname to extract storage path from full URL
- **JSON Stringification**: Colors and fonts stored as JSON strings in database, parsed on read
- **Card Component Pattern**: Card, CardHeader, CardTitle, CardContent from @saasfly/ui
- **DashboardShell Pattern**: Wrapper component with title and description for consistent settings page layout
- **FileReader API**: Client-side file preview with reader.onloadend callback pattern
- **Confirmation Dialog**: Browser confirm() for destructive actions (delete)

**Additional insights**:
- Brand Kit is a premium feature (FREE users have 0 limit) - monetization strategy
- Logo storage uses public URLs (getPublicUrl) not signed URLs - logos are public assets
- Brand kit applies globally to all carousels created by user (if isDefault is true or explicitly selected)
- Settings UI is client-only ('use client') - all data fetching via useEffect + fetch
- Real-time preview is critical UX - helps users visualize brand before saving
- No batch operations - must create/update/delete kits one at a time
- Brand kit rendering in carousels handled by EditorCanvas (analyzed in iteration 5) - logo at (940, 20), handle at (540, 1310)
- Storage path pattern ensures natural organization and isolation (each user has own folder)
- Font options match those available in EditorCanvas theme controls (analyzed in iteration 6)
---


## 🔴 Potential Issues Noticed (Updated after Iteration 11)

| Module | Issue Type | Description |
|--------|-----------|-------------|
| brand_kit | High | No Tier Limit Enforcement on Backend - Frontend may gate brand kit creation by tier limits (FREE: 0, CREATOR: 1, PRO: 5), but backend APIs don't verify subscription tier. Users could bypass limits by manipulating requests. |
| brand_kit | Medium | Logo URL Parsing May Fail - Lines 129-134 in [id]/route.ts extract storage path by splitting logoUrl. Could fail if URL format changes or is malformed, preventing logo deletion. |
| brand_kit | Low | No Logo Preview CORS Handling - Frontend logo preview doesn't handle CORS errors if logo URL fails to load from storage. |
| brand_kit | Medium | isDefault Race Condition - If two simultaneous requests set isDefault=true, both could succeed before either updates other kits, resulting in multiple default brand kits. |
| brand_kit | High | No Brand Kit Usage Check - DELETE endpoint doesn't verify if brand kit is currently in use by projects. Deleting could break existing carousels referencing that kit. |
| brand_kit | Low | Form Validation Incomplete - handleSave only checks name.trim(), doesn't validate colors are valid hex codes or fonts are in allowed list. Invalid data could be submitted. |
| brand_kit | Medium | No Storage Failure Fallback - If Supabase Storage is down, API fails hard with no graceful degradation or partial success handling. |
| brand_kit | Low | Large Logo Performance - Logo file size (5MB max) only checked on upload. Large logos in existing kits may cause rendering performance issues in carousels. |


---
## Iteration 12 - Style Kits Module

**Files analyzed**:
- apps/nextjs/src/app/api/style-kits/route.ts (GET /api/style-kits)
- apps/nextjs/src/app/api/style-kits/[id]/route.ts (GET /api/style-kits/:id)
- packages/db/prisma/seed.ts (8 style kit definitions)

**Test cases created**: 10 (TC-STYLEKIT-001 through TC-STYLEKIT-010)

**Key business logic discovered**:
- **Public API Endpoints**: Both list and detail endpoints are public (no authentication required) - style kits are reference data accessible to all
- **8 Seeded Style Kits**: 4 free (isPremium: false) + 4 premium (isPremium: true)
  - Free: minimal_clean, high_contrast_punch, marker_highlight, sticky_note
  - Premium: corporate_pro, gradient_modern, dark_mode_punch, soft_pastel
- **Ordering Strategy**: GET /api/style-kits returns kits ordered by isPremium asc (free first), then id asc (route.ts lines 15-16)
- **Style Kit Structure**: Each kit contains:
  - typography: {headline_font, headline_weight, body_font, body_weight}
  - colors: {background, foreground, accent, marker (optional)}
  - spacingRules: {padding: 'tight'|'normal'|'roomy', line_height: 1.3|1.5|1.7}
  - isPremium: boolean flag for tier gating
- **Advanced Features**: Premium kit "gradient_modern" uses CSS linear-gradient for background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` (seed.ts lines 127-129)
- **Font Support**: 5 Google Fonts used across kits: Inter, Poppins, Lora, Source Sans Pro, Roboto Mono
- **Line Height Options**: 3 spacing presets - tight (1.3), normal (1.5), roomy (1.7) - affect text density
- **Idempotent Seeding**: Seed script checks for existing kits before inserting (lines 416-438), prevents duplicates on repeated runs
- **No Backend Tier Enforcement**: API returns all style kits regardless of user tier - frontend responsible for filtering premium kits

**Potential bugs noticed**:
1. **No Backend Tier Enforcement for Premium Kits**: Frontend filters premium kits based on subscription tier, but backend GET /api/style-kits doesn't check user auth or tier. Savvy users could bypass frontend filtering by directly calling API with premium kit IDs.
2. **No Validation for Style Kit References**: Projects can reference styleKitId but no validation ensures the ID exists in database. If style kit deleted manually, projects would have invalid references causing rendering errors.
3. **Gradient Background Rendering Challenge**: Premium kit "gradient_modern" uses CSS linear-gradient format. EditorCanvas (Konva.js) and render-slide.ts (@napi-rs/canvas) may not support CSS gradient strings without special parsing.
4. **No Style Kit Versioning**: If a style kit's colors/fonts are updated in seed data, existing projects using that kit would suddenly change appearance. No versioning or snapshot mechanism.

**Patterns for other modules**:
- **Public Reference Data Pattern**: Style kits are global reference data, not user-owned resources. No auth required for read access.
- **Seed Data Pattern**: Reference data defined in seed.ts, checked for existence before insertion, prevents duplicates
- **isPremium Flag Pattern**: Simple boolean for tier gating, frontend filters based on this flag, no complex permission logic
- **Ordered List Pattern**: orderBy multiple fields (isPremium asc, id asc) ensures consistent, predictable ordering
- **CSS Gradient Storage**: Store CSS gradient string in colors.background field, requires special rendering logic in canvas
- **Typography + Spacing + Colors Structure**: Clean separation of styling concerns into 3 objects

**Codebase patterns discovered**:
- **withErrorHandler Wrapper**: route.ts uses withErrorHandler for consistent error handling (line 10)
- **Public Endpoints**: No withAuth() or withAuthAndErrors() wrapper - endpoints are truly public
- **Kysely orderBy Chain**: .orderBy('isPremium', 'asc').orderBy('id', 'asc') for multi-field sorting
- **ApiErrors.notFound()**: Consistent error response for missing resources ([id]/route.ts line 29)
- **Seed Script Structure**: Check existence → insert if missing → log success, idempotent design
- **JSON Storage**: typography, colors, spacingRules stored as JSON columns in database
- **String IDs**: Style kit IDs are strings (e.g., 'minimal_clean') not UUIDs - human-readable, used in URLs

**Additional insights**:
- Style kits are the foundation of visual customization - without them, carousels have no styling system
- Public API access is intentional - users preview styles before creating accounts
- Seed data is well-designed with clear names and distinct visual styles
- 4 free kits provide meaningful choice for FREE tier users (not a "freemium trap")
- Premium kits justify paid subscriptions with advanced features (gradients, sophisticated color schemes)
- Frontend tier gating is UX convenience but not security - backend doesn't enforce
- Gradient rendering will require special handling in both editor canvas and export pipeline
- Line height multipliers directly affect text overflow - tighter spacing fits more content but may overflow
- No CRUD operations for style kits - they're static reference data, only seeded once
- Style kit selection happens at project creation and can be changed in editor (StyleKitSelector component)
---

---
## Iteration 13 - Billing & Subscriptions

**Files analyzed**:
- apps/nextjs/src/app/api/stripe/checkout/route.ts (Stripe checkout session creation)
- apps/nextjs/src/app/api/webhooks/stripe/route.ts (Webhook entry point)
- packages/stripe/src/webhooks.ts (Webhook event handlers)
- packages/stripe/src/plans.ts (PriceId → Tier mapping)
- apps/nextjs/src/app/[lang]/(dashboard)/settings/billing/page.tsx (Billing UI)
- apps/nextjs/src/hooks/use-subscription.ts (Feature gating hook)
- apps/nextjs/src/app/api/profile/route.ts (Profile API for tier retrieval)

**Test cases created**: 14 (TC-BILLING-001 through TC-BILLING-014)

**Key business logic discovered**:
- **Stripe Integration Architecture**: Two API endpoints - checkout creation (POST /api/stripe/checkout) and webhook handler (POST /api/webhooks/stripe). Checkout creates session with userId metadata, webhook updates Profile.subscriptionTier based on Stripe events.
- **Checkout Flow**: 
  - Frontend calls /api/stripe/checkout with priceId (CREATOR or PRO)
  - API validates priceId against env vars (lines 31-38 in checkout/route.ts)
  - Creates Stripe session with mode='subscription', userId in metadata and subscription_data.metadata
  - Returns session URL, frontend redirects to Stripe hosted checkout
- **Webhook Event Handlers**: 4 events handled:
  1. **checkout.session.completed** (lines 10-48): Initial subscription purchase, retrieves subscription → maps priceId to tier → updates Profile
  2. **invoice.payment_succeeded** (lines 50-83): Recurring payment success, ensures tier stays current
  3. **customer.subscription.deleted** (lines 85-108): Cancellation/non-payment, reverts to FREE tier
  4. **customer.subscription.updated** (lines 110-139): Plan change (CREATOR ↔ PRO), updates tier based on new priceId
- **PriceId → Tier Mapping**: PLANS object in plans.ts maps env price IDs to SubscriptionTier enum. getSubscriptionPlan(priceId) returns tier, defaults to FREE if priceId not found.
- **Tier Limits Configuration**: TIER_LIMITS object in use-subscription.ts defines all feature limits:
  - FREE: 3 carousels, 8 slides, watermark=true, 3 style kits, 0 brand kits
  - CREATOR: 30 carousels, 15 slides, no watermark, 8 style kits, 1 brand kit
  - PRO: unlimited carousels (-1), 20 slides, no watermark, 8 style kits, 5 brand kits, custom_fonts, priority_exports
- **Feature Gating Methods**:
  - canUse(feature): Returns boolean - true if feature available in tier
  - getLimit(feature): Returns numeric limit (-1 for unlimited, 0 for disabled, >0 for count)
  - requiresUpgrade(feature): Returns true if feature requires higher tier
- **Billing Page UI**: 
  - Shows current plan with tier name, price, next billing date (for paid tiers)
  - Displays 3 plan cards (FREE/CREATOR/PRO) with feature lists and checkmarks
  - Current plan has blue border/badge, upgrade buttons for higher tiers
  - handleUpgrade creates checkout session, redirects to Stripe
- **Profile API**: GET /api/profile returns subscriptionTier (source of truth for feature gating). Used by useSubscription hook on mount.

**Potential bugs noticed**:
1. **No Backend Tier Enforcement**: Frontend enforces feature limits (carousel count, slide count, style kit access) but backend APIs don't verify subscriptionTier. Savvy users could bypass limits by manipulating API requests directly.
2. **Webhook Signature Only Security**: Webhook validates Stripe signature but doesn't verify profile exists before creating checkout session. If checkout URL intercepted, could create session for non-existent user.
3. **Missing userId Throws Error**: If subscription metadata lacks userId (edge case), webhook throws error and returns 400 - correct behavior but could benefit from alerting/monitoring.
4. **No Billing Page Error UI**: If profile fetch fails, page silently defaults to FREE tier without showing error banner to user (lines 77-79). User might think they've been downgraded.
5. **Next Billing Date Simplified**: Line 160 in page.tsx calculates next billing as current + 30 days, not actual Stripe subscription period end. Could confuse users on annual plans.
6. **No Webhook Idempotency**: Webhook handlers don't check if tier update already occurred. If Stripe retries same event, database UPDATE runs multiple times (harmless but inefficient).
7. **PriceId Mismatch Defaults to FREE**: If Stripe sends webhook with unrecognized priceId, getSubscriptionPlan defaults to FREE (line 18 in plans.ts). Paying user could be downgraded silently.
8. **No Subscription Status Check**: Webhooks don't verify subscription.status === 'active'. Inactive subscriptions could still update tier to paid.

**Patterns for other modules**:
- **Webhook Pattern**: Entry route validates signature (stripe.webhooks.constructEvent) → calls handler function with event → handler matches event.type → updates database → returns 200/400
- **PriceId Validation**: Whitelist validation against env vars before Stripe API call (prevents arbitrary price manipulation)
- **Metadata Passing**: Store userId in both session metadata AND subscription_data.metadata to ensure availability in all webhook events
- **Feature Gating Centralization**: Single hook (useSubscription) with TIER_LIMITS constant provides consistent feature access logic across entire app
- **Upgrade Flow Pattern**: Frontend button → POST to checkout API → receive URL → redirect to external service (Stripe) → callback with success param → reload state
- **Tiered Pricing Display**: Card grid with current plan visual distinction, feature lists with checkmarks, CTAs based on user's tier
- **Fallback to Free**: When uncertain (API error, unrecognized priceId), default to FREE tier (safest fallback for monetization)

**Codebase patterns discovered**:
- **Stripe Library Usage**: @saasfly/stripe package exports stripe client, handleEvent function, getSubscriptionPlan helper
- **Stripe Event Types**: Use Stripe.DiscriminatedEvent type for type-safe event handling
- **Webhook Signature Validation**: stripe.webhooks.constructEvent(payload, signature, secret) validates and parses webhook
- **Env Var Validation**: @saasfly/stripe/env uses T3 env validation for Stripe keys (NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID, NEXT_PUBLIC_STRIPE_PRO_PRICE_ID, STRIPE_WEBHOOK_SECRET)
- **Profile Lookup by Clerk ID**: All webhook handlers query Profile by clerkUserId (not Stripe customerId) - Profile doesn't store Stripe IDs
- **Kysely Update Pattern**: .updateTable('Profile').where('id', '=', profile.id).set({ subscriptionTier }).execute()
- **Checkout Session Config**: mode='subscription', payment_method_types=['card'], client_reference_id=userId, metadata includes userId
- **Frontend Redirect**: window.location.href = session.url (full page redirect to Stripe, not iframe)
- **useEffect Profile Fetch**: Hook fetches /api/profile on mount with empty deps array, sets tier state
- **Loading/Upgrading States**: Separate loading (initial fetch) and upgrading (specific priceId) state variables

**Additional insights**:
- Billing is the ONLY way to change subscriptionTier from FREE to paid tiers - no admin override endpoint found
- Stripe webhooks are the source of truth for subscription status - frontend billing page just displays state
- No customer portal integration found - users cannot self-cancel through app UI (must contact support or use Stripe portal directly)
- Checkout session successUrl includes session_id param but page doesn't use it (could show success toast)
- Profile.subscriptionTier is the ONLY field updated by webhooks - no Stripe customerId, subscriptionId, or payment info stored in Profile
- useSubscription hook is called by: billing page, create page (generation limits), editor page (feature gating), brand kit settings (limit checks)
- No trial period logic found - users start as FREE, must pay to upgrade
- Watermark enforcement happens in export worker (analyzed in iteration 8) - fetches subscriptionTier and adds watermark text if FREE
- Brand kit limit of 0 for FREE tier prevents any brand kit creation (hard block, not soft limit)
- PRO tier "unlimited carousels" represented as -1 in TIER_LIMITS, checked with === -1 in canUse logic
- Billing page PRICING_TIERS matches useSubscription TIER_LIMITS exactly - good consistency
- No downgrade confirmation flow - subscription deletion immediately sets tier to FREE
- Webhook processing is synchronous - if database update fails, Stripe will retry webhook
---


## 🔴 Potential Issues Noticed (Updated after Iteration 13)

| Module | Issue Type | Description |
|--------|-----------|-------------|
| billing | Critical | No Backend Tier Enforcement - Frontend enforces feature limits (carousel count, slide count, style kit access) but backend APIs don't verify subscriptionTier. Savvy users could bypass limits by manipulating API requests directly. |
| billing | Medium | Webhook Signature Only Security - Webhook validates Stripe signature but doesn't verify profile exists before processing. Edge case: if checkout session created for non-existent user, webhook will fail. |
| billing | High | Missing userId Error Handling - If subscription metadata lacks userId (should never happen, but edge case), webhook throws error and returns 400. Needs monitoring/alerting for production. |
| billing | Low | No Billing Page Error UI - If profile fetch fails (line 77-79), page silently defaults to FREE tier without showing error banner to user. User might think they've been downgraded. |
| billing | Low | Next Billing Date Simplified - Line 160 in page.tsx calculates next billing as current + 30 days, not actual Stripe subscription period_end. Could confuse users on annual plans or promo periods. |
| billing | Medium | No Webhook Idempotency - Webhook handlers don't track processed events. If Stripe retries same event (network glitch), database UPDATE runs multiple times. Harmless but inefficient. |
| billing | High | PriceId Mismatch Defaults to FREE - If Stripe sends webhook with unrecognized priceId (new plan not in env), getSubscriptionPlan defaults to FREE (line 18 in plans.ts). Paying user could be silently downgraded. |
| billing | High | No Subscription Status Check - Webhooks don't verify subscription.status === 'active' before updating tier. Past_due, canceled, or unpaid subscriptions could still update user to paid tier temporarily. |



---
## Iteration 14 - Feature Gating Module

**Files analyzed**:
- apps/nextjs/src/hooks/use-subscription.ts (152 lines) - Feature gating hook
- apps/nextjs/src/app/api/profile/route.ts (47 lines) - Subscription tier source
- apps/nextjs/src/app/[lang]/(dashboard)/create/page.tsx (lines 77-110) - Real-world tier enforcement
- apps/nextjs/src/app/[lang]/(dashboard)/editor/[id]/page.tsx (line 24) - Watermark check

**Test cases created**: 10 (TC-FEATGATE-001 through TC-FEATGATE-010)

**Key business logic discovered**:
- **TIER_LIMITS Configuration**: Single source of truth constant (lines 34-62) defines all feature limits for 3 tiers
  - FREE: 3 carousels, 8 slides, watermark=true, 3 style kits, 0 brand kits, no custom_fonts, no priority_exports
  - CREATOR: 30 carousels, 15 slides, no watermark, 8 style kits, 1 brand kit, same boolean features as FREE
  - PRO: unlimited carousels (-1), 20 slides, no watermark, 8 style kits, 5 brand kits, custom_fonts=true, priority_exports=true
- **Hook Methods**: 3 public methods for feature gating:
  - canUse(feature): Returns boolean - true if feature available (handles both numeric and boolean limits)
  - getLimit(feature): Returns numeric limit (-1 for unlimited, 0 for disabled, >0 for count)
  - requiresUpgrade(feature): Returns true if feature needs higher tier (inverse of canUse)
- **Tier Fetch Pattern**: useEffect on mount calls GET /api/profile, extracts subscriptionTier, defaults to FREE on error/401
- **Unlimited Sentinel**: -1 used for unlimited features (PRO carousels), checked with === -1 in line 118
- **Boolean Features**: watermark, custom_fonts, priority_exports stored as boolean in TIER_LIMITS, returned directly by canUse()
- **Zero Access Pattern**: brand_kits = 0 for FREE tier means complete feature block, no partial access
- **Frontend Enforcement Locations**:
  - Create page (lines 77-110): Carousel limit, slide limit, style kit access checks BEFORE API calls
  - Editor page (line 24): Watermark display check
  - Brand kit settings: Zero access for FREE tier (complete feature block)
- **Server-Side Enforcement**: Only watermark is enforced server-side (export worker), all other limits are frontend-only (CRITICAL SECURITY ISSUE)
- **Error Messages**: Specific numeric limits shown in error messages ("limit of 3 carousels", "up to 8 slides")
- **Upgrade Prompts**: Yellow/purple banners with tier-specific CTAs linking to /settings/billing

**Potential bugs noticed**:
1. **CRITICAL: No Backend Tier Enforcement**: Frontend checks carousel limits, slide limits, style kit access, brand kit access - but backend APIs don't verify subscriptionTier. Savvy users can bypass by manipulating API requests (POST directly to /api/generate/topic, /api/brand-kits, etc.). This is a revenue-impacting security vulnerability.
2. **Style Kit Count Discrepancy**: TIER_LIMITS.FREE.style_kits = 3 (line 39), but seed.ts has 4 free style kits (minimal_clean, high_contrast_punch, marker_highlight, sticky_note). Which is correct? Should be resolved.
3. **No Carousel Limit Refresh**: projectCount fetched on /create page mount but not refreshed if user creates carousel in another tab. Stale count could allow bypassing limit check (race condition).
4. **Profile Fetch Error Handling**: If GET /api/profile fails, hook defaults to FREE tier silently (lines 77-94). User might be paid subscriber but see FREE tier limits during outage. No user-facing error message.
5. **No Tier Update Notification**: When user upgrades via Stripe, subscription hook doesn't automatically refresh. User must refresh page to see new tier limits. Could add webhook callback or periodic polling.
6. **No Usage Tracking**: Hook provides limits but doesn't track actual usage (e.g., 2/3 carousels used). Create page manually fetches projectCount. Should be centralized in hook.

**Patterns for other modules**:
- **Feature Gating Pattern**: useSubscription hook called in any component needing tier checks, provides 3 methods (canUse, getLimit, requiresUpgrade)
- **TIER_LIMITS Constant Pattern**: Single source of truth for all tier-based limits, referenced across entire app
- **Sentinel Value Pattern**: -1 for unlimited, 0 for disabled, >0 for countable limits - clean and consistent
- **Boolean Feature Pattern**: Store boolean directly in TIER_LIMITS for simple on/off features (watermark, custom_fonts, priority_exports)
- **Error Message Pattern**: Include specific numeric limit in error ("limit of 3 carousels") for clarity
- **Upgrade CTA Pattern**: Link to /settings/billing with clear tier differentiation (Creator vs Pro requirements)
- **Server-Side Enforcement Pattern**: Watermark in export worker fetches subscriptionTier from database - correct security model (should be applied to all gated features)
- **Zero Access Pattern**: Use limit = 0 for complete feature blocking (brand kits for FREE tier)

**Codebase patterns discovered**:
- **SubscriptionTier Type**: Imported from @saasfly/db/prisma/enums - database enum type ('FREE' | 'CREATOR' | 'PRO')
- **FeatureName Type**: Union type of all gatable features (carousels, slides, watermark, style_kits, brand_kits, custom_fonts, priority_exports)
- **Hook Return Type**: SubscriptionInfo interface with tier, loading, error, and 3 methods
- **Default to FREE Pattern**: All error cases default to FREE tier (safest fallback for monetization)
- **Profile API Response**: Returns full Profile object including subscriptionTier (used by multiple hooks/components)
- **GET /api/profile Pattern**: Protected by withAuthAndErrors, queries Profile by clerkUserId, returns subscriptionTier as source of truth

**Additional insights**:
- Feature gating is the CORE monetization mechanism - must be bulletproof
- Hook is called in multiple critical paths: create page (generation), editor page (watermark), billing page (display), brand kit settings (access)
- Frontend-only enforcement is acceptable for UX (immediate feedback) but MUST have backend validation for security
- Watermark is only feature with proper server-side enforcement - this is the correct pattern
- Tier limits are product decisions - changing them requires updating TIER_LIMITS constant only (single source of truth)
- Upgrade prompts are conversion funnels - must be clear, non-intrusive, and actionable
- FREE tier is intentionally limited but functional (not a trial) - 3 carousels is enough for evaluation
- PRO tier's "unlimited" is represented as -1, checked with === -1 (not > some_high_number)
- Brand kits having 0 limit for FREE tier is intentional - premium feature exclusively for paying customers
- No middleware helper for tier checks - each API route must implement its own validation (opportunity for improvement)
- Export worker is the only place that correctly enforces tier (fetches from database, not client state)
---
