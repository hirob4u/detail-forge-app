# DetailForge -- Build Log

**Started:** February 2026  
**Builder:** Ben Foran -- Foranware -- detailforge.io  
**Companion to:** Agent-Driven Build Plan v1.0

---

## How to Use This File

One entry per Blueprint task, added after the task passes acceptance criteria and is committed. Fill in every field. If there was no correction round, write `None` in the Corrected and Root Cause fields. Do not edit previous entries -- this log is append-only.

**Commit format:** `type: description` where type is one of `feat`, `fix`, `schema`, `chore`

---

## Entries

---

### 2026-02-24 -- Blueprint E -- Initial Neon Schema Migration

**Built:** Full database schema for all six entities: Organization, Customer, Vehicle, Job, Product, UsageLog. Drizzle ORM config. Neon serverless client. All tables migrated and visible in Neon dashboard.

**Worked well:** Agent produced all six table definitions correctly on the first pass. Column types, foreign keys, cascade deletes, and indexes were all accurate. `drizzle-kit generate` and `drizzle-kit migrate` ran clean.

**Corrected:** None.

**Root cause:** None.

**Commit:** `schema: initial Neon schema with all six entities`  
**Time to merge:** ~20 min

---

### 2026-02-24 -- Blueprint C -- Design Tokens, Global Styles, and App Shell Layout

**Built:** `design-tokens.ts` with full DetailForge color/font/radius system. `globals.css` dark-mode-only stylesheet with CSS custom properties. DM Sans and JetBrains Mono loaded via `next/font/google`. Lazer 84 self-hosted via `@font-face`. App shell layout with sidebar nav (Dashboard, Jobs, Customers, Supplies, Settings), responsive mobile collapse, and placeholder dashboard page.

**Worked well:** Color token values and CSS custom property naming were accurate on first pass. Font loading for DM Sans and JetBrains Mono worked correctly. Sidebar layout and responsive behavior were solid.

**Corrected:** Lazer 84 was skipped in the initial Blueprint because it is not available on Google Fonts. A follow-up correction Blueprint added it as a self-hosted font via `@font-face` in `globals.css`.

**Root cause:** Blueprint gap -- did not specify that Lazer 84 requires self-hosting and provide the `@font-face` declaration. Agent correctly followed the Blueprint instruction to skip it but should have been given a path forward.

**Commit:** `feat: design tokens, global styles, Lazer 84, and app shell layout`  
**Time to merge:** ~35 min including correction

---

### 2026-02-24 -- Blueprint B -- Better Auth with Org-Scoped Sessions

**Built:** Better Auth server and client instances. Organization plugin for multi-tenant session scoping. Catch-all API route handler. Route protection via `proxy.ts`. Sign in and sign up pages with dark mode styling. Auth layout.

**Worked well:** Sign in and sign up page styling was accurate on first pass. Auth client setup and the catch-all API route handler were correct. Organization plugin was wired in correctly.

**Corrected:** Two issues required a correction Blueprint. (1) `middleware.ts` is deprecated in Next.js 16 -- renamed to `proxy.ts`. (2) Better Auth Drizzle adapter threw a `BetterAuthError` because the Better Auth schema tables (user, session, account, verification) were not added to the Drizzle schema and the schema object was not passed directly to the adapter.

**Root cause:** Next.js 16 breaking change post-dates much of the model's training data. Better Auth schema requirement was not specified in the Blueprint -- should have explicitly called out that Better Auth requires its own tables and the full schema object passed to the adapter.

**Commit:** `feat: Better Auth with org-scoped sessions and protected routes`  
**Time to merge:** ~45 min including correction

---

### 2026-02-24 -- Blueprint A -- New Estimate Screen (ABORTED)

**Built:** Nothing merged. Blueprint was cancelled mid-run.

**Worked well:** The Claude API route structure and `ConditionAssessment` TypeScript type were correctly specified. The two-panel condition report and estimate builder UI approach was sound.

**Corrected:** Blueprint was aborted entirely before acceptance criteria were tested. The core value proposition of the product was misread -- the Blueprint had the detailer uploading photos, which is the exact problem DetailForge is supposed to solve. The correct flow is: customer uploads photos via a public unauthenticated intake form, AI generates a preliminary estimate, detailer reviews and finalizes in an authenticated screen.

**Root cause:** Product Spec language around "photo upload" was written ambiguously enough that the Blueprint framed the detailer as the person uploading photos. The Brand Identity doc actually had this right all along -- the Customer Intake mockup shows "Precision Auto Detail" as the brand with "powered by DetailForge" as a small mark, clearly a customer-facing surface. The spec and build plan docs needed to make this explicit. All docs updated before new Blueprints were written.

**Commit:** None -- branch deleted, no merge.  
**Time to merge:** N/A -- aborted

---

### 2026-02-24 -- Spec Update -- Public Intake URL Pattern Defined

**Built:** Product Spec updated to v1.2. Organization entity gains `intakeSlug` field. Public intake URL pattern defined as `detailforge.io/estimate/[intakeSlug]`. Settings screen updated to include intake link management and QR code. Embeddable widget (iframe/script embed) explicitly added to out-of-scope section.

**Worked well:** N/A -- documentation update only.

**Corrected:** None.

**Root cause:** None.

**Commit:** `chore: update Product Spec to v1.2 -- intake URL pattern and embed out of scope`
**Time to merge:** N/A -- docs only

---

### 2026-02-25 -- Blueprint F -- fix/presign-content-length

**Built:** Removed ContentLength from PutObjectCommand in presign route.

**Worked well:** Root cause was identifiable from the presigned URL query string
-- content-length in X-Amz-SignedHeaders was the tell.

**Corrected:** None -- this was the correction.

**Root cause:** PutObjectCommand included ContentLength which forced it into
signed headers. Browser upload content-length never matches a pre-signed value.

**Commit:** `fix: remove ContentLength from presigned URL generation`
**Time to merge:**

---

### 2026-02-25 -- Blueprint F -- fix/photo-storage-and-r2-access

**Built:** Converted entire photo storage model from public URLs to private R2 object keys. Updated presign route, photo uploader, intake submit, validation schema, and DB schema type.

**Worked well:** The analyze route already fetched from R2 via SDK with credentials -- only the storage and upload paths needed fixing.

**Corrected:** None -- this was the correction.

**Root cause:** The R2 utility and presign route generated public URLs from an R2_PUBLIC_URL env var, treating the bucket as publicly accessible. Photos were stored as URLs instead of object keys, breaking the analyze route and exposing photos publicly.

**Commit:** `fix: store R2 object keys instead of public URLs for photos`
**Time to merge:**

---

### 2026-02-27 -- Blueprint F -- feat/intake-photo-sections

**Built:** Split single photo upload zone into Exterior Photos (min 2, max 8) and Interior Photos (min 1, max 4) sections. Each section has its own label, helper text, counter in JetBrains Mono, minimum warning in amber, and colored left border accent (purple for exterior, cyan for interior). Submit button disabled until both minimums are met.

**Worked well:** PhotoUploader component cleanly accepted new props (label, helperText, minPhotos, maxPhotos, accentColor) without structural changes to the upload logic. Two instances in the intake form maintain independent state and combine keys on submit.

**Corrected:** None.

**Root cause:** None.

**Commit:** `feat: split photo upload into exterior and interior sections`
**Time to merge:**

---

### 2026-02-27 -- Blueprint F -- fix/photo-uploader-visual-polish

**Built:** Restructured PhotoUploader layout. "Add photo" tile is now an equal-sized grid tile alongside thumbnails in a `grid-cols-3 gap-2 sm:grid-cols-4` grid. Counter moved inline with section label at top-right. Card uses `border-l-2` accent with no background fill. Removed `cn` import (no longer needed).

**Worked well:** Layout change was purely structural -- upload logic, props interface, and parent form were untouched.

**Corrected:** None -- this was the correction.

**Root cause:** Original layout used a large dashed-border wrapper around the entire grid, making the section look sparse before photos were added.

**Commit:** `fix: compact photo uploader layout with grid-based add tile`
**Time to merge:**

---

### 2026-02-26 -- Blueprint D -- Claude Vision API Route (api/estimate-analyze)

**Built:** POST route at `/api/estimates/analyze`. Accepts jobId, photoKeys, and vehicle info. Fetches photos from private R2 bucket via AWS SDK. Converts to base64. Calls Claude Sonnet via Anthropic SDK with detailing-specific assessment rubric. Returns structured `ConditionAssessment` JSON. Updates Job record in Neon with `aiAssessment`.

**Worked well:** Route structure, R2 SDK fetch, base64 conversion, and Claude API call all worked correctly once credentials and model string were confirmed. JSON parsing and Job record update were clean.

**Corrected:** Three correction rounds required. (1) Route was initially protected but curl has no session -- moved testing to browser console. (2) Model changed from `claude-opus-4-5` to `claude-sonnet-4-5` for cost efficiency. (3) Photo storage format was wrong -- stored full public URLs instead of object keys, requiring the full private R2 fix below.

**Root cause:** Initial Blueprint did not enforce private R2 architecture explicitly enough. Agent stored public URLs because the presign route was returning them. Correct architecture -- private bucket, object keys only, presigned GET on demand -- was not specified with enough force in the original Blueprint.

**Commit:** `feat: Claude vision API route with R2 photo fetching and condition assessment`
**Time to merge:** ~3 hours including correction rounds

---

### 2026-02-26 -- Blueprint F -- Private R2 Storage and Object Key Architecture (fix/photo-storage-and-r2-access)

**Built:** Corrected the full photo storage architecture. Presign route now returns `{ presignedUrl, key }` only -- no public URL. PhotoUploader stores keys not URLs. Intake submit route stores photos as `{ key, phase, area }` structured objects in JSONB. Analyze route fetches photos from private R2 via SDK using object keys.

**Worked well:** Once the architecture was clearly specified the agent implemented it cleanly. R2 SDK streaming to Buffer to base64 worked correctly on first pass.

**Corrected:** None in this Blueprint -- this was the correction.

**Root cause:** Original presign route returned a publicUrl alongside the presignedUrl. Agent used the publicUrl path of least resistance throughout the intake and analyze flow. The bucket should have been private from day one with no public URL concept in the codebase.

**Commit:** `fix: private R2 storage with object keys and SDK photo fetching`
**Time to merge:** ~45 min

---

### 2026-02-26 -- Blueprint F -- Intake Form Photo Sections (feat/intake-photo-sections)

**Built:** Split single generic photo uploader into two labeled sections -- Exterior Photos (min 2, max 8) and Interior Photos (min 1, max 4). Each section has its own guidance text, counter, and minimum warning. Submit button requires both minimums to be met. All keys combined into flat array on submit.

**Worked well:** Component split was clean. Two PhotoUploader instances with different props worked correctly. Combined key array passed to submit route without issues.

**Corrected:** Visual layout required a polish pass -- the upload zones rendered as large empty boxes. Restructured to compact grid layout where the Add Photo tile lives inline with thumbnails.

**Root cause:** Blueprint specified the layout structure but the agent defaulted to a full-width dashed zone instead of a compact grid. Should have included a more explicit grid-first layout spec in the original Blueprint.

**Commit:** `feat: split photo upload into exterior and interior sections`
**Time to merge:** ~1 hour including visual polish

---

### 2026-02-26 -- Infrastructure -- R2 CORS and Endpoint Configuration

**Built:** No code change. Resolved two infrastructure issues blocking photo uploads: (1) R2 S3 client was missing the explicit endpoint override causing requests to route to AWS S3 instead of Cloudflare R2. (2) CORS policy added to the `detail-forge-photos` bucket in Cloudflare dashboard to allow browser-side PUT requests from localhost:3000.

**Worked well:** Once the endpoint was corrected the presigned URL pointed at the right bucket. CORS preflight confirmed working via curl OPTIONS test.

**Corrected:** Bucket name mismatch -- env var had `detailforge-photos` but actual bucket was `detail-forge-photos`. Fixed in `.env.local`.

**Root cause:** Blueprint did not specify the R2 endpoint override explicitly. Agent used default AWS SDK endpoint resolution which routes to amazonaws.com. R2 requires `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` as an explicit endpoint override in the S3 client config.

**Commit:** `fix: R2 endpoint config and CORS policy`
**Time to merge:** ~2 hours including diagnosis

---

### 2026-02-27 -- Prompt Engineering -- Condition Assessment Quality Tuning (IN PROGRESS)

**Built:** Initial `ConditionAssessment` JSON returning correctly from Claude Sonnet with all five score dimensions, recommended services, confidence score, and flags. Full 200 response confirmed in 23.9 seconds. `aiAssessment` column populated in Neon.

**Worked well:** End-to-end chain confirmed working -- intake form, R2 upload, analyze route, Claude API call, Neon update all functioning correctly.

**Corrected:** Assessment output quality needs tuning. Scores, descriptions, recommended services, and pricing require prompt engineering iteration to produce results a professional detailer would trust.

**Root cause:** First-pass system prompts rarely produce production-quality output. Prompt tuning is iterative work, not a Blueprint task.

**Commit:** Pending -- tuning in progress
**Time to merge:** TBD

---


### 2026-02-28 -- Product Decision -- Structured Photo Capture (REPLACES generic upload)

**Built:** Nothing coded yet -- product decision documented before Blueprint is written.

**Worked well:** N/A

**Corrected:** The two-section photo uploader (Exterior / Interior) is being replaced entirely. Generic "upload some photos" guidance produces inconsistent photo coverage and lower AI assessment quality. The new approach is structured capture -- each required shot has a defined label, purpose, and area tag that gets passed to the AI prompt so the model knows exactly what it is analyzing.

**Root cause:** Not a bug -- a product quality decision. A guided flow produces better AI input, better customer experience, and higher detailer trust. Every job will have the same baseline photo coverage instead of whatever the customer happened to grab.

**Commit:** N/A -- decision only
**Time to merge:** N/A

---

### 2026-02-28 -- Blueprint A -- feat/structured-photo-capture

**Built:** Replaced the two-section generic photo uploader (Exterior / Interior) with a structured capture component (`StructuredPhotoCapture`). Eight required shots (driver-side, passenger-side, front, rear, hood, driver-seat, rear-seat, dashboard) and five optional shots (damage-area up to 4, wheel, trunk, headliner, engine-bay). Each shot tile shows label, icon, guidance text, and area tag. Photos upload immediately on selection via presigned URLs. Parent receives `{ key, area, phase }` structured objects for storage. Validation schema and submit route updated to accept structured photo objects instead of raw key strings. Old `photo-uploader.tsx` deleted.

**Worked well:** Component architecture cleanly separated internal `CapturedPhoto` state from the parent-facing `{ key, area, phase }` interface via `useEffect`. Shot definitions as constants made the grid rendering straightforward. Reusing `ShotTile` for both required and optional shots avoided duplication. Damage-area multi-photo expansion using React Fragment worked correctly in CSS Grid.

**Corrected:** Validation schema and submit route required a minimal update to accept `{ key, area, phase }` objects instead of plain strings, despite the blueprint specifying no submit route changes. The blueprint's own instructions to pass structured objects to the route required this change.

**Root cause:** Blueprint specified both "do not change the intake submit route" and "pass photos directly as the photoKeys field -- it already has the { key, area, phase } structure." These were contradictory since the route previously mapped string keys to structured objects. The correct interpretation was to update the validation and route minimally to accept the new format.

**Commit:** `feat: structured photo capture with labeled shots and area tags`
**Time to merge:**

---

### 2026-03-02 -- Blueprint F -- fix/structured-photo-capture-modes

**Built:** Added two-mode interface to StructuredPhotoCapture component. Guided mode shows one full-width shot card at a time with progress bar, Previous/Next/Skip navigation, and thumbnail strip. Batch mode shows a vertical card list with label and guidance text on the left, upload zone on the right. Mode toggle at the top with "Step-by-step" (default, purple) and "Upload all at once" buttons. Switched from per-tile hidden inputs to a shared `inputRefs` map with hidden inputs rendered once for all 13 shot areas. Removed the old grid-based `ShotTile` component entirely.

**Worked well:** Shared `inputRefs` pattern cleanly decoupled file inputs from render mode. Both modes read the same `photos` state so switching modes preserves all uploaded photos. Progress bar and thumbnail strip in guided mode give clear feedback without taking space from the shot card.

**Corrected:** None.

**Root cause:** Original implementation rendered all shots as small square tiles in a 2×4 grid. Labels and guidance text were unreadable at mobile sizes. The Blueprint spec included guided and batch modes but the initial implementation ignored them in favor of the simpler grid layout.

**Commit:** `fix: add guided and batch modes to structured photo capture`
**Time to merge:**

---

### 2026-03-02 -- Blueprint F -- fix/cloudflare-opennext-deployment

**Built:** Switched Cloudflare Pages adapter from `@cloudflare/next-on-pages` (Edge Runtime) to `@opennextjs/cloudflare` (Node.js runtime with `nodejs_compat`). Created `wrangler.jsonc`, `open-next.config.ts`, and `public/_headers`. Added `preview` and `deploy` scripts. Updated `next.config.ts` with `optimizePackageImports` for bundle size and server-side minimize. Converted DB connection to factory function (`getDb()`) for Workers request isolation. Removed all `export const runtime = 'edge'` exports. Added `.open-next` to `.gitignore`.

**Worked well:** DB was already on `@neondatabase/serverless` with `neon()` HTTP driver. No API route logic needed changes. The `getDb()` factory with `export const db = getDb()` maintains backwards compatibility so no import changes were needed across the codebase.

**Corrected:** The previous `fix/edge-runtime-config` branch added `export const runtime = 'edge'` to all routes. This was the wrong approach -- the correct adapter (`@opennextjs/cloudflare`) uses Node.js runtime and does not need or want Edge Runtime exports. All edge runtime exports were removed.

**Root cause:** `@cloudflare/next-on-pages` requires Edge Runtime on every route, which breaks the AWS SDK, Node.js streams, and many Next.js features. `@opennextjs/cloudflare` runs on Node.js runtime with the `nodejs_compat` compatibility flag, supporting the full stack without modifications.

**Commit:** `fix: switch to @opennextjs/cloudflare for Cloudflare Pages deployment`
**Time to merge:**

---

### 2026-03-03 -- Blueprint F -- fix/remove-cloudflare-config

**Built:** Removed all Cloudflare deployment infrastructure. Uninstalled `@opennextjs/cloudflare` and `wrangler`. Deleted `wrangler.jsonc` and `open-next.config.ts`. Removed `preview` and `deploy` scripts from `package.json`. Reverted `next.config.ts` to minimal clean config. Kept `public/_headers` (valid for any CDN) and `.open-next` in `.gitignore`. No `export const runtime = 'edge'` exists anywhere in source.

**Worked well:** Cleanup was straightforward. `npm run build` passes clean with all routes rendering correctly.

**Corrected:** None -- this was the correction, reverting the previous `fix/cloudflare-opennext-deployment` changes.

**Root cause:** Cloudflare deployment adapter was added prematurely before the deployment target was finalized. The adapter and its configuration added complexity without being needed yet.

**Commit:** `fix: remove Cloudflare deployment config and restore clean state`
**Time to merge:**

---

### 2026-03-03 -- Blueprint -- schema/prompt-management

**Built:** Added `prompts` table to Drizzle schema (id, name, version, content, active, timestamps). Created `scripts/prompt-content.txt` with a comprehensive ~280-line detailing assessment prompt covering vehicle verification, age calibration, paint type identification, panel repaint detection, water spots/etching, piano black surfaces, glass assessment, interior material assessment, headliner assessment, staining/pet hair/clutter/odor, scoring rubric, critical rules, professional writing standard, and structured JSON output schema. Created `scripts/seed-prompt.ts` with version-incrementing idempotent seeding. Updated `/api/estimates/analyze` route to fetch the active prompt from the database instead of using a hardcoded constant. Added `seed:prompt` npm script.

**Worked well:** Migration generated and applied cleanly. Analyze route update was minimal -- replaced the hardcoded `SYSTEM_PROMPT` constant with a DB query at the top of the handler. Output schema in the prompt now includes `vehicleVerification` field for vehicle mismatch detection.

**Corrected:** Seed script initially used static ES module imports (`import { db } from "../src/lib/db"`). Static imports are hoisted and execute before any code, so `dotenv.config()` had not loaded `DATABASE_URL` yet when the DB module initialized. Restructured to use dynamic `await import()` calls inside the async function body so dotenv loads first.

**Root cause:** ES module import hoisting. When a script needs environment variables loaded before a module initializes (e.g., the DB client reads `DATABASE_URL` at import time), all dependent imports must be dynamic `await import()` calls placed after `dotenv.config()`.

**Commit:** `schema: add prompts table, seed script, and DB-driven assessment prompt`
**Time to merge:**

---

### 2026-03-03 -- Blueprint -- feat/detailer-review-screen

**Built:** Detailer review screen at `/dashboard/jobs/[jobId]/review`. AI assessment flags surfaced for in-person verification with amber alert icons. Vehicle mismatch warning renders in red when `appearsToMatch` is false. Feedback mechanism (helpful / needs work toggle + notes textarea) added for prompt improvement data collection. Quote builder pre-populated from AI recommended services with editable prices, toggle per line item, and "Add service" for manual additions. Total updates in real time. Finalize Quote POSTs to `/api/jobs/[jobId]/finalize`, transitions job stage to `quoted`, stores `finalQuote`, `assessmentFeedbackRating`, and `assessmentFeedback` on the job record. Job detail page created at `/dashboard/jobs/[jobId]` with conditional "Review Assessment" / "View Quote" button. Review page renders read-only when job is already quoted. Schema updated: `quoted` added to `jobStageEnum`, new columns `assessmentFeedback`, `assessmentFeedbackRating`, `finalQuote`, `quotedAt` on jobs table. `QuoteLineItem` and `FinalQuote` types defined in `src/lib/types/quote.ts`.

**Worked well:** Two-column layout (flags left, quote right) collapses cleanly to stacked vertical on mobile. Pre-populating quote line items from `aiAssessment.recommendedServices` with `included: true` gives the detailer a starting point that requires minimal adjustment. The feedback mechanism is lightweight -- two buttons and a textarea, no friction.

**Corrected:** None.

**Root cause:** None.

**Commit:** `feat: detailer review screen with AI flags, feedback, and quote builder`
**Time to merge:**

---

### 2026-03-03 -- Blueprint -- feat/background-analysis

**Built:** Background analysis wired into intake submission using fire-and-forget `fetch` to avoid Vercel/serverless function timeout. New `analysisStatus` column on jobs table (`processing` | `complete` | `failed`) drives a four-state UI on the job detail page. Lightweight polling endpoint at `/api/jobs/[jobId]/status` returns only status fields -- no photos or full assessment data. `AnalysisStatusPanel` client component polls every 3 seconds during `processing`, transitions to "AI Assessment Ready" with Review Assessment button on `complete`, shows retry button on `failed`, and shows "View Quote" on `quoted` stage. Analyze route wrapped in try/catch -- sets `analysisStatus` to `failed` on any error. Retry button fires a new analyze call and resumes polling.

**Worked well:** Fire-and-forget pattern keeps intake submission response fast. Polling with `setInterval` + `useEffect` cleanup is simple and reliable. The `AnalysisStatusPanel` handles all four states without a page reload -- the server component renders the initial state, then the client component takes over with live updates.

**Corrected:** None.

**Root cause:** None.

**Commit:** `feat: background analysis with live status polling and retry`
**Time to merge:**

---

### 2026-03-03 -- Blueprint F -- fix/analyze-photo-resize-and-key-extraction

**Built:** Added `sharp` image processing to the analyze route. iPhone photos from R2 are resized to 800px wide at 75% JPEG quality before base64 encoding for Claude Vision API — reduces a 6MB+ raw photo to ~150KB. Hardened `photoKeys` extraction to accept both `string[]` (manual triggers) and `{ key, area, phase }[]` (structured intake objects), preventing the `[object Object]` key error. Updated `fetchPhotoAsBase64` to return typed `{ base64, mediaType }` objects instead of raw strings. Updated Claude image blocks to use the typed properties.

**Worked well:** `sharp` handles HEIC, PNG, and JPEG inputs transparently — the `.jpeg()` output call converts any input format to JPEG. The defensive `typeof k === 'string' ? k : k.key` extraction is simple and handles both caller formats without schema changes.

**Corrected:** None — this was the correction. Two bugs fixed: (1) raw iPhone photos exceeded Claude's 5MB per image limit, (2) structured `{ key, area, phase }` objects were being stringified to `[object Object]` as R2 keys when passed directly from the intake submit route.

**Root cause:** (1) Photos were passed to Claude as raw base64 without any resizing. iPhone photos at 12MP are 4-8MB each — well over Claude's 5MB per image hard limit. (2) The `photoKeys` type was `string[]` but the intake submit route sends `{ key, area, phase }[]` objects. Without explicit key extraction, JS coerces the object to the string `[object Object]` when used as an R2 key.

**Commit:** `fix: resize photos with sharp and extract keys from structured objects`
**Time to merge:**

---

### 2026-03-04 -- Blueprint -- feat/detailer-dashboard

**Built:** Complete detailer dashboard. Moved all existing dashboard pages (`/dashboard/jobs/[jobId]` and `/dashboard/jobs/[jobId]/review`) inside the `(app)` route group so they receive the sidebar layout. Created dashboard home at `/dashboard` with stage summary cards (7 stages in a responsive grid) linking to filtered job views, plus 10 most recent jobs. Created jobs list at `/jobs` with 8 filter tabs (All + 7 stages) as horizontally scrollable links updating the `?stage=` param. Created customers list at `/customers` with job count per customer. Created supplies and settings shell pages. Shared `StageBadge` component maps stage + analysisStatus to labeled colored pills (e.g. "Analyzing..." for created+processing, "Ready to Review" for created+complete). Shared `JobCard` component shows customer name, vehicle, stage badge, relative timestamp via `date-fns`, and final quote total. Created authenticated API routes for `/api/jobs` (with optional `?stage=` filter) and `/api/customers`. Installed `date-fns` for relative timestamps.

**Worked well:** The `(app)` route group cleanly separates layout concerns — all authenticated pages get the sidebar without any per-page layout imports. Stage filter tabs as `<Link>` components with `searchParams` are simple server-rendered navigation with no client-side state. `leftJoin` for customer/vehicle data required nullable types in `JobCard` props — caught by TypeScript.

**Corrected:** `JobCard` props initially typed customer/vehicle as non-nullable objects, but `leftJoin` returns `null` when no matching row exists. Fixed by making the customer and vehicle props nullable with optional chaining in the render.

**Root cause:** `leftJoin` in SQL returns null for the joined table's columns when no match exists. The TypeScript types from Drizzle correctly reflect this as `T | null` at the top level of the joined object, not just on individual fields.

**Commit:** `feat: complete detailer dashboard with job pipeline and customer list`
**Time to merge:**

---

### 2026-03-04 -- Blueprint -- feat/org-branding-settings

**Built:** Organization profile and branding settings page at `/settings`. Server component fetches org data and renders `BrandingForm` client component with 4 independent sections: Business Profile (name, email, phone, website, city, state), Customer-Facing Branding (shop name, tagline with 120 char counter), Logo (upload to R2 via authenticated presign route, preview, remove), and Theme (accent color picker with hex input, shop name font selector with live preview). PATCH route at `/api/org/profile` validates with Zod and updates the organizations table. Logo presign route at `/api/org/logo-presign` requires auth and uses the existing `createPresignedUploadUrl` helper. Schema updated with 6 new columns on organizations: `shopName`, `shopTagline`, `logoKey`, `logoUrl`, `accentColor`, `nameFont`. Success feedback shows green checkmark for 3 seconds after save.

**Worked well:** Reusing the existing `createPresignedUploadUrl` helper from `src/lib/r2.ts` for logo uploads kept the presign route minimal. The 4-section card layout naturally groups related settings without overwhelming the page. Font preview with live accent color gives immediate visual feedback.

**Corrected:** None.

**Root cause:** None.

**Commit:** `feat: organization branding settings with logo upload and theme customization`
**Time to merge:**

---

### 2026-03-04 -- Blueprint -- feat/apply-org-branding

**Built:** Applied org branding to the customer intake page and dashboard sidebar. Intake page header renders org logo when set, falling back to shop name (or org name) in the selected font with tagline. Accent color applied via `--color-brand` CSS custom property on the intake page wrapper, replacing all `--color-purple-action` references across the intake form and structured photo capture components. Hover states use `--color-brand-hover` computed via `color-mix()`. Google Fonts loaded dynamically via `<link>` when the selected `nameFont` is not DM Sans or JetBrains Mono (both already in the global stack). "Powered by DetailForge.io" badge added to the intake page footer — non-removable, low opacity, links to marketing site in a new tab. Dashboard sidebar wordmark replaced with org logo when set via a server component (`SidebarWordmark`) wrapped in `Suspense` with the DetailForge text as the fallback. Layout refactored: `layout.tsx` converted to a server component, interactive shell extracted to `AppShell` client component, wordmark passed through as a React node prop.

**Worked well:** The server/client component split for the sidebar was clean — `AppShell` receives the wordmark as a prop, `SidebarWordmark` queries the DB server-side, and `Suspense` ensures no layout shift. The `--color-brand` CSS variable approach works well because child client components inherit it without needing brand data passed as props. `color-mix()` for the hover shade avoids needing to compute darker hex values in JS.

**Corrected:** Layout refactored from client to server component. The blueprint specified `<Suspense>` + `<SidebarWordmark />` inside the layout, but since the layout was a `"use client"` component, server components could not be imported directly. Refactored to server layout + client `AppShell` + server `SidebarWordmark` following the standard Next.js pattern for mixing server and client components.

**Root cause:** Server components cannot be imported into `"use client"` files — they become client components at the boundary. The correct pattern is to render server components in a server parent and pass them as React node props to client components.

**Commit:** `feat: apply org branding to intake page and dashboard sidebar`
**Time to merge:**

---

### 2026-03-04 -- Blueprint F -- fix/org-id-bridge

**Built:** Org ID bridge between Better Auth nanoid organization IDs and DetailForge UUID organization IDs. Added `betterAuthOrgId` column to the `organizations` table with a unique constraint. Created `getDetailForgeOrgId()` and `getDetailForgeOrg()` utility functions in `src/lib/org.ts` as the single point of resolution from session org ID to app data layer UUID. Updated sign-up flow to create a DetailForge `organizations` record linked to the Better Auth org via `betterAuthOrgId` after `organization.create()` succeeds, then call `setActive()`. Created `/api/org/create` route for the sign-up form to create the linked record. Updated all 12 files that previously used `session.session.activeOrganizationId` directly as a database foreign key: dashboard, jobs, customers, settings server components; sidebar wordmark; jobs API, customers API, finalize API, org profile API (GET and PATCH). Manually populated existing org record with correct `betterAuthOrgId`.

**Worked well:** The `getDetailForgeOrgId` utility centralizes the resolution cleanly — every caller follows the same 3-line pattern: extract `betterAuthOrgId` from session, resolve via utility, guard on null. The `getDetailForgeOrg` variant returns the full record for components that need branding fields (sidebar wordmark).

**Corrected:** The `org/profile` route (GET and PATCH) was not listed in the blueprint's affected files but also used `activeOrganizationId` directly to query `organizations.id`. Updated both handlers. Also removed a stale `TODO: VERIFY` comment in the finalize route since the org ID mapping pattern is now established.

**Root cause:** Better Auth organization IDs are nanoids (short random strings like `iYTBtl9y...`), not UUIDs. The DetailForge `organizations` table uses UUIDs as primary keys. All app data tables (jobs, customers, vehicles) reference the DetailForge UUID. Using the Better Auth nanoid directly as a foreign key returns zero results because no UUID matches a nanoid.

**Commit:** `fix: org ID bridge linking Better Auth nanoid to DetailForge UUID`
**Time to merge:**

---

### 2026-03-04 -- Blueprint F -- fix/branding-photos-org-bridge

**Built:** Three changes shipped together. (1) Replaced free-form color picker in branding settings with 7 curated accent color swatches -- no hex input, no native color picker. (2) Created `/api/jobs/[jobId]/photos` GET route that generates presigned R2 GET URLs for a job's photos, with auth + org ownership verification. Added `createPresignedGetUrl` helper to `src/lib/r2.ts`. (3) Added photo viewer to the detailer review screen -- grid of labeled thumbnails with a keyboard-navigable lightbox overlay. Photos load on mount via the new API route.

**Worked well:** The curated swatch approach is simpler than the color picker + hex input and prevents invalid colors. The photo viewer lightbox uses keyboard navigation (arrow keys + escape) via a `useEffect` event listener with proper cleanup. Initializing `photosLoading` from the `hasPhotos` prop avoids a synchronous `setState` inside `useEffect`.

**Corrected:** ESLint flagged `setPhotosLoading(true)` called synchronously in a `useEffect` body. Fixed by initializing the state from the `hasPhotos` prop instead.

**Root cause:** React strict mode ESLint rules prohibit synchronous `setState` in effect bodies to prevent cascading renders.

**Commit:** `fix: curated color swatches, photo viewer, and presigned GET URLs`
**Time to merge:**

---

### 2026-03-04 -- Blueprint F -- fix/intake-branding-and-auto-org

**Built:** Three changes. (1) Shop name on intake page now renders in org accent color (`--color-brand`) instead of white (`--color-text`). (2) Neon color palette applied to branding settings -- replaced generic web colors with 7 neon swatches (Purple, Cyan, Green, Amber, Orange, Pink, Teal) matching the DetailForge dark mode aesthetic. Initialization guard defaults non-matching saved colors to purple. (3) Auto-org middleware added to `proxy.ts` -- intercepts protected route requests, detects null `activeOrganizationId`, looks up the user's first org membership via Better Auth API, and calls `set-active` automatically. Fixes mobile and new browser sessions that hit the no-org error without manual intervention. Auth page redirect also added (authenticated users on /sign-in redirect to /dashboard).

**Worked well:** Using the existing `proxy.ts` (Next.js 16 middleware file) instead of creating a separate `middleware.ts` avoids the naming conflict documented in errata. The `ALLOWED_HEXES` Set derived from the ACCENT_COLORS array ensures the guard stays in sync automatically. The auto-org fetch calls go through `/api/auth/organization/list` and `/api/auth/organization/set-active` (verified from Better Auth plugin source).

**Corrected:** Blueprint specified `src/middleware.ts` but Next.js 16 uses `proxy.ts` (documented in errata). Updated `proxy.ts` instead.

**Root cause:** Blueprint was written against the standard Next.js convention. Next.js 16 renamed `middleware.ts` to `proxy.ts`.

**Commit:** `fix: intake brand color, neon palette, and auto-org middleware`
**Time to merge:**

---

### 2026-03-04 -- Blueprint F -- fix/route-loading-states

**Built:** `loading.tsx` files added for all 7 protected routes. Shared `PageSkeleton` component shows centered spinner (`Loader2` from lucide-react) and "Loading..." label during server component resolution. Covers dashboard, jobs, customers, supplies, settings, job detail, and review screen. Sidebar remains visible during navigation -- loading state only affects the content area.

**Worked well:** Single `PageSkeleton` component reused by all 7 loading files keeps the pattern DRY. Next.js App Router automatically wraps the page in a `Suspense` boundary when `loading.tsx` is present, so no manual `Suspense` wiring was needed.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: add loading states for all protected routes`
**Time to merge:**

---

### 2026-03-04 -- Blueprint F -- fix/review-photo-lightbox

**Built:** Photo lightbox in review screen updated. Background scroll locked when lightbox is open via `document.body.style.overflow`. Prev/next navigation buttons added with `bg-black/60` pill styling. Keyboard arrow key navigation added using functional updater pattern in `setSelectedIndex`. Photo counter shows current position (e.g. "3 / 11") in top-left corner. Area label shown below the photo using `AREA_LABELS` lookup map for human-readable names. Escape key closes lightbox. Cleanup function always restores body scroll.

**Worked well:** Functional updater pattern (`setSelectedIndex(i => ...)`) in the keyboard handler avoids stale closure issues -- the effect only re-registers when `selectedIndex` or `photos.length` changes, not on every render. The `AREA_LABELS` map provides clean display names for hyphenated area keys.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: photo lightbox with scroll lock, nav buttons, and keyboard navigation`
**Time to merge:**

---

### 2026-03-04 -- Blueprint F -- fix/settings-theme-ui

**Built:** Replaced font selector dropdown with visual font card grid. Each card renders the font name and sample text in the actual typeface via dynamic Google Fonts loading. Added 3 new fonts (Outfit, Syne, Anybody) to the existing 4 (DM Sans, JetBrains Mono, Inter, Space Grotesk) for 7 total options. Google Fonts loaded on mount via `useEffect` that injects `<link>` tags with dedup by element ID. Color swatch shape changed from `rounded-full` to `rounded-[var(--radius-button)]` per design system rules. Font initialization guarded with `ALLOWED_FONT_NAMES` Set to prevent invalid saved values from crashing the picker. Server-side Zod validation updated to accept all 7 font names.

**Worked well:** Dynamic Google Fonts loading via DOM `<link>` injection is simple and the browser deduplicates fonts already loaded by Next.js. The visual card grid gives immediate feedback -- users see the actual typeface before selecting it, unlike the dropdown which showed plain text labels in the system font.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: visual font cards, Google Fonts loading, and swatch shape`
**Time to merge:**

---

### 2026-03-05 -- Blueprint F -- fix/sidebar-user-panel

**Built:** Sidebar user panel showing logged-in user initials avatar, name, and email at the bottom of the sidebar. Logout button signs out via `authClient.signOut()` and redirects to `/sign-in`. Server component (`SidebarUser`) fetches session data, client component (`SidebarUserClient`) handles logout interaction. Passed to `AppShell` as a `userSlot` ReactNode prop, wrapped in `Suspense` with `null` fallback to prevent layout shift. Avatar uses `rounded-[var(--radius-badge)]` per design system rules (no `rounded-full`).

**Worked well:** Same server/client split pattern used for `SidebarWordmark` applied cleanly. The `userSlot` prop keeps `AppShell` as a pure layout component with no data fetching. `Suspense fallback={null}` means the sidebar renders without the user panel during the session fetch rather than showing a skeleton or flashing.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: sidebar user panel with initials avatar and logout`
**Time to merge:**

---

### 2026-03-05 -- Blueprint -- feat/invite-only-signup

**Built:** Invite-only sign-up system. Added `invites` table to schema (code, email lock, usedAt, usedBy, createdByNote). Sign-up page requires a verified invite code before account creation -- invite code input with Verify button, green confirmation or red error feedback. Middleware redirects `/sign-up` without `?code=` param to `/waitlist` page. Waitlist page shows invite-only messaging with mailto link. Invite codes marked as used only on successful account creation (not on validation) to prevent codes being burned by failed sign-ups. Admin script `npm run create-invite` generates codes with optional `--email=`, `--note=`, and `--count=` flags. Codes are case-insensitive, always normalized to uppercase. `/api/invites/` added to public prefixes in proxy so validation works without auth.

**Worked well:** The invite validation endpoint is stateless -- it checks but does not mutate. The actual `usedAt`/`usedBy` write happens in `/api/org/create` after the org record is successfully created, so failed sign-ups never burn a code. Middleware redirect to waitlist is a single pathname + searchParams check placed before the session check. The `useSearchParams` hook pre-fills the code from the URL so invite links work as expected.

**Corrected:** Blueprint specified `src/middleware.ts` but this project uses `src/proxy.ts` (Next.js 16, documented in errata). Used `drizzle-kit push` instead of `drizzle-kit migrate` because the migration journal had unapplied older migrations that conflicted with the live schema.

**Root cause:** `drizzle-kit migrate` replays all unapplied migrations sequentially. When earlier migrations were applied via `push` instead of `migrate`, the journal is out of sync and older migrations fail on already-existing columns.

**Commit:** `feat: invite-only sign-up with invite codes, waitlist, and admin script`
**Time to merge:**

---

### 2026-03-06 -- Blueprint F -- fix/mobile-layout-and-invite-ux

**Built:** Four fixes. (1) Auth layout `min-h-screen` replaced with `min-h-dvh` so sign-in, sign-up, and waitlist pages are vertically centered on mobile browsers. (2) App shell `h-screen` replaced with `h-dvh` so the dashboard fills the visible viewport on mobile without content shifting below browser chrome. (3) Waitlist page broken sign-up link removed -- previously linked to `/sign-up` without a code which middleware redirected back to `/waitlist` in a loop. Replaced with instructional text. (4) Invite code validation changed from optimistic to verified -- `inviteValid` initializes as `false` and a `useEffect` auto-validates the code on mount when present in the URL. Green checkmark only appears after the database confirms the code is valid.

**Worked well:** `dvh` units are natively supported in Tailwind v4 with no config changes. The auto-validate `useEffect` reuses the existing `handleValidateCode` function so no logic was duplicated.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: mobile dvh viewport, waitlist link loop, and invite auto-validation`
**Time to merge:**

---

### 2026-03-06 -- Blueprint F -- fix/waitlist-and-contrast

**Built:** Three changes. (1) Waitlist page replaced mailto button with plain text showing email in a purple accent span and instructional text about invite links -- no interactive elements that could break or confuse users. (2) Invite code validation already fixed on main (auto-validate via useEffect, `inviteValid` initialized as `false`). (3) Replaced all 10 `disabled:opacity-*` instances across 7 files with explicit disabled color overrides. Filled buttons get `disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed`. Ghost and outline buttons get `disabled:text-[var(--color-muted)] disabled:cursor-not-allowed`. Disabled inputs get `disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed`.

**Worked well:** `grep -rn "disabled:opacity" src/app` as acceptance criteria made it easy to find all instances and verify zero remain. The two-pattern rule (filled vs ghost) was simple to apply consistently.

**Corrected:** None.

**Root cause:** `disabled:opacity-*` reduces the entire element's opacity including background, border, and text. On neon-colored backgrounds this produces illegible muddy text. Explicit color overrides ensure disabled states are always readable regardless of the element's enabled-state background color.

**Commit:** `fix: replace disabled:opacity with explicit color overrides across entire codebase`
**Time to merge:**

---

### 2026-03-06 -- Blueprint -- feat/job-stage-management

**Built:** Job stage management with allowed transitions, server-side validation, and full audit trail. Added `archived` to `jobStageEnum` and typed `stageHistory` JSONB column on jobs table. Created `STAGE_TRANSITIONS` map in `src/lib/stage-transitions.ts` defining allowed forward and backward transitions for all 8 stages. PATCH endpoint at `/api/jobs/[jobId]/stage` validates the requested transition against the allowed map, appends to `stageHistory`, and updates the stage. `StageControls` client component renders purple filled buttons for forward transitions and ghost outline buttons for backward transitions. Backward moves and archive actions show an amber confirmation dialog before executing. `StageHistory` component displays the full audit trail newest first with relative timestamps. Complete is a terminal state with no outbound transitions. Archived jobs can only be restored to Created.

**Worked well:** The shared `STAGE_TRANSITIONS` map used by both the API route (server-side validation) and the UI component (button rendering) keeps the allowed transitions in sync without duplication. The confirmation dialog pattern using amber color clearly signals caution without implying danger (red) or normal action (purple).

**Corrected:** None.

**Root cause:** None.

**Commit:** `feat: job stage management with transitions, controls, and history`
**Time to merge:**

---

### 2026-03-06 -- Blueprint -- feat/qc-photo-upload

**Built:** QC screen at `/dashboard/jobs/[jobId]/qc` with auto-generated checklist from AI assessment flags and finalized quote line items. Checklist items toggle between Pass and Rework with auto-save on every toggle. Before/after photo comparison grid shows intake photos on left and QC upload slots on right, grouped by area. After photos upload to R2 via presigned PUT URLs under `qc/[orgId]/[jobId]/` path. QC notes field saves on blur. Completion gate unlocks when all checklist items pass, showing a link back to the job detail page to mark complete via stage controls. QC screen only accessible when `job.stage === 'qc'` -- server component redirects to job detail for any other stage. Schema adds `qcPhotos`, `qcNotes`, `qcCompletedAt`, and `qcChecklist` JSONB columns to jobs table. Lightbox for photo viewing follows same pattern as review screen. Job detail page shows prominent "Open QC" link when job is in QC stage.

**Worked well:** Reusing `createPresignedGetUrl` from `src/lib/r2.ts` for signing both before and after photos kept the GET route clean. Checklist generation from `finalQuote.lineItems` and `aiAssessment.flags` produces relevant QC items without manual configuration. Auto-save on checklist toggle gives instant feedback without a save button.

**Corrected:** Blueprint referenced `jobs.services` column which does not exist -- services come from `finalQuote.lineItems`. Adapted the GET route to extract included service names from the finalized quote instead.

**Root cause:** Blueprint was written before the final schema was confirmed. The `services` field was assumed to be a top-level column but the data lives inside the `finalQuote` JSONB structure.

**Commit:** `feat: QC screen with checklist, before/after photos, and completion gate`
**Time to merge:**

---

### 2026-03-06 -- Blueprint F -- fix/photo-loading-placeholders

**Built:** Shared `PhotoThumbnail` client component (`src/app/(app)/_components/photo-thumbnail.tsx`) that handles image loading with a spinner placeholder, fade-in transition on load, error state display, and area label overlay. Shared `PhotoGridSkeleton` component (`src/app/(app)/_components/photo-grid-skeleton.tsx`) that renders a grid of spinning placeholder tiles during API fetch. Updated the review form photo grid to use `PhotoThumbnail` instead of inline `<button>` + `<img>` markup and replaced the "Loading photos..." text with `PhotoGridSkeleton`. Updated the QC form before/after photo display to use `PhotoThumbnail` (with green border class for after photos) and replaced the QC loading state with `PhotoGridSkeleton`.

**Worked well:** Extracting the thumbnail pattern into a shared component eliminated duplicated loading/error/fade-in logic across review and QC forms. The `aspect-square` container on `PhotoThumbnail` prevents layout shift before images load. The `className` prop on `PhotoThumbnail` allows the QC form to apply the green border for after photos without a separate component.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: shared PhotoThumbnail and PhotoGridSkeleton prevent layout shift during photo loading`
**Time to merge:**

---

### 2026-03-06 -- Blueprint F -- fix/photo-two-phase-loading

**Built:** Photo loading refactored to two-phase approach. New `/api/jobs/[jobId]/photos/meta` endpoint returns DB metadata only (no R2 calls) in under 50ms, allowing labeled placeholder slots to render immediately. New `/api/jobs/[jobId]/photos/urls` POST endpoint accepts an array of R2 keys and returns presigned GET URLs in parallel after metadata arrives. Key validation ensures every requested key belongs to the job's `photos` or `qcPhotos` arrays before signing -- returns 403 for invalid keys. `PhotoThumbnail` updated with `loading` prop and optional `src` to support the two-phase state where labels show immediately and images fade in as URLs resolve. Review form and QC form both updated to the two-phase pattern. QC GET route no longer signs URLs -- returns metadata only. Area labels derived directly from the area key string (`formatAreaLabel`) instead of a hardcoded lookup table. `photo-areas.ts` confirmed deleted (never existed in codebase). Existing `/api/jobs/[jobId]/photos` route preserved for backward compatibility.

**Worked well:** Splitting metadata from URL signing eliminated the blocking R2 presign latency from the initial render. The `PhotoThumbnail` `loading` prop cleanly bridges the gap between metadata arriving (label visible) and URL arriving (image fades in). Using `formatAreaLabel` to derive labels from the key string eliminated all hardcoded `AREA_LABELS` maps across the codebase.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: two-phase photo loading with /photos/meta and /photos/urls endpoints`
**Time to merge:**

---

### 2026-03-10 -- Blueprint F -- fix/r2-key-structure-and-logos-bucket

**Built:** Separated R2 infrastructure into dual-bucket architecture. `r2.ts` rewritten with `PHOTOS_BUCKET` (`R2_BUCKET_PHOTOS`) and `LOGOS_BUCKET` (`R2_BUCKET_LOGOS`) exported constants. `createPresignedUploadUrl` now takes `{orgId, jobId, area, fileName, contentType}` with key pattern `photos/{orgId}/{jobId}/{area}-{timestamp}.{ext}`. New `createPresignedLogoUploadUrl` function for logos bucket with key pattern `logos/{orgId}/{timestamp}-{random}-{safeName}`. Logo presign route updated to resolve orgId via `getDetailForgeOrgId` and use new logo function. Org profile route updated to use `R2_LOGOS_PUBLIC_URL` instead of `R2_PUBLIC_URL`. Intake presign route now looks up orgId from orgSlug via DB and generates keys inline using `PHOTOS_BUCKET` (no jobId at intake time). QC upload route and estimates/analyze route updated to use `PHOTOS_BUCKET` from shared r2.ts instead of `R2_BUCKET_NAME`. Analyze route's local `r2Client` removed in favor of shared `r2` import.

**Worked well:** Exporting `PHOTOS_BUCKET` and `LOGOS_BUCKET` as constants from r2.ts allows routes that need inline key generation (intake, QC) to use the correct bucket without `process.env` references scattered across the codebase. The estimates/analyze route previously had its own `S3Client` instance -- consolidating to the shared `r2` export eliminated the duplication.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: dual R2 bucket architecture with separate photos and logos buckets`
**Time to merge:**

---

### 2026-03-10 -- Blueprint F -- fix/logo-url-env-var

**Built:** Fixed logo URL construction in org profile PATCH handler. Environment variable corrected from `R2_LOGOS_PUBLIC_URL` to `NEXT_PUBLIC_LOGOS_URL`.

**Worked well:** One-line fix, no other changes needed.

**Corrected:** None -- this was the correction.

**Root cause:** Previous Blueprint (`fix/r2-key-structure-and-logos-bucket`) renamed `R2_PUBLIC_URL` to `R2_LOGOS_PUBLIC_URL`, but the actual environment variable configured in Vercel and `.env.local` is `NEXT_PUBLIC_LOGOS_URL`. The code was referencing a variable that does not exist.

**Commit:** `fix: correct logo URL env var from R2_LOGOS_PUBLIC_URL to NEXT_PUBLIC_LOGOS_URL`
**Time to merge:**

---

### 2026-03-11 -- Blueprint F -- fix/logo-and-font-picker

**Built:** Estimates page header updated to left-aligned logo and shop name lockup -- logo renders at h-12 beside shop name in brand font and color. DetailForge wordmark restored in dashboard sidebar -- removed org logo from SidebarWordmark, now a pure static component with no DB call. Font picker replaced with swatch grid matching color picker layout -- each card renders the shop name in the actual font, no font name labels shown. FONTS array updated to DM Sans, Inter, Syne, Barlow, Oswald, Bebas Neue, Montserrat. Server-side Zod validation updated to match. Logo preview size increased to h-20 in settings with max-w-[240px]. Google Fonts URLs updated in estimates page server component to include new fonts.

**Worked well:** Converting SidebarWordmark from async server component (with DB call) to pure static component simplified the layout -- no Suspense wrapper needed for the wordmark slot. Font swatch grid reuses the same aspect-square + selection ring pattern as color swatches for visual consistency.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: estimates header lockup, sidebar wordmark, font swatch grid, and logo preview size`
**Time to merge:**

---

### 2026-03-11 -- Blueprint -- feat/estimate-page-redesign

**Built:** Full redesign of the estimates page layout. Replaced vertically-centered narrow `max-w-lg` column with top-anchored `max-w-2xl` layout. Shop name renders in `colors.text` instead of brand color (previously read as a hyperlink). `min-h-screen` (used twice) replaced with single `min-h-dvh` on the page shell. All hardcoded hex removed -- brand fallback uses `colors.purpleAction` from imported design tokens, all other values reference CSS custom properties. IntakeForm wrapped in an elevated surface card (`bg-[var(--color-elevated)]` with `border-[var(--color-border)]` and `rounded-[var(--radius-card)]`) consistent with dashboard JobCard treatment. Identity region separated from form by an accent bar (brand color, `h-0.5 w-10`) above a `colors.border` horizontal rule. Section label "Vehicle & contact details" added inside the form card. Page intent label restyled to `text-xs uppercase tracking-widest opacity-60`. Footer moved outside `<main>` as a proper `<footer>` element.

**Worked well:** Importing `colors` from `design-tokens.ts` for the brand fallback eliminates the last hardcoded hex. CSS custom property references in Tailwind classes (`var(--color-text)` etc.) remain the correct pattern because Tailwind's static extractor cannot resolve JS template interpolations at scan time.

**Corrected:** Blueprint specified template literal interpolation in className (`` bg-[${colors.background}] ``). This does not work with Tailwind's static extraction -- it sees the template string, not the resolved value. Adapted to use CSS variable references (`bg-[var(--color-background)]`) which Tailwind extracts correctly and which resolve to the same hex values at runtime.

**Root cause:** Tailwind scans source files as text to discover utility classes. JS template literals are not evaluated during scanning, so `bg-[${colors.background}]` is seen literally as `bg-[${colors.background}]`, not `bg-[#0A0A0F]`. CSS custom property references like `bg-[var(--color-background)]` are extracted as-is and resolve at runtime.

**Commit:** `feat: estimates page redesign with token-based layout and surface card`
**Time to merge:**

---

### 2026-03-11 -- Blueprint F -- fix/estimate-page-mobile

**Built:** Full-bleed mobile layout for the estimates page. Form card surface treatment (border, rounded corners, elevated background) removed on mobile and restored at `sm` breakpoint using `sm:rounded-[var(--radius-card)] sm:border sm:border-[var(--color-border)] sm:bg-[var(--color-elevated)]`. Outer main padding set to `px-0 sm:px-8` so form content sits edge to edge on mobile. Header gets its own `px-4 sm:px-0` inset. Form section uses `px-4 py-6 sm:px-6 sm:py-8` for comfortable mobile inset without card chrome. Logo responsive at `h-10 sm:h-14`, shop name at `text-2xl sm:text-3xl`. Vertical padding reduced to `py-6 sm:py-16`.

**Worked well:** Using `sm:` prefixed card styles (border, bg, rounded) is clean -- mobile gets zero card treatment by default, desktop gets the full card. The form section's own `px-4` handles mobile horizontal inset directly since main is `px-0`.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: full-bleed mobile layout for estimates page`
**Time to merge:**

---

### 2026-03-11 -- Blueprint F -- feat/settings-font-picker

**Built:** Replaced the font picker in the settings branding form. The old grid used large aspect-square cells with the full shop name as preview text -- it took up too much vertical space and made it hard to compare fonts at a glance. Replaced with compact `h-11 w-11` flex-wrap swatches showing "Df" specimen text rendered in each font, matching the color picker layout. Selection state uses `border-white scale-110` ring consistent with color swatches. Added a live preview panel below the swatch row that renders the shop name in the selected font at the current accent color.

**Worked well:** Matching the font picker layout to the existing color picker (flex-wrap row of small swatches with border-white scale-110 selection) keeps the branding section visually consistent. The "Df" specimen text is short enough to fit in a small swatch while still showing the typeface character.

**Corrected:** None.

**Root cause:** None.

**Commit:** `feat: compact font picker swatches with live preview panel`
**Time to merge:**

---

### 2026-03-11 -- Blueprint F -- fix/settings-font-picker-size

**Built:** Reduced font picker swatch dimensions from `h-11 w-11` to `h-9 w-9` to match the color picker swatches directly above. Both pickers now use identical swatch sizes so the Theme section reads as a unified control group.

**Worked well:** Single two-class change, no side effects. The "Df" specimen text at `text-base font-semibold` fills the smaller box tightly and remains legible across all seven fonts.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: match font picker swatch size to color picker (h-9 w-9)`
**Time to merge:**

---

### 2026-03-11 -- Blueprint F -- fix/ui-polish-wordmark-swatches

**Built:** Three related UI polish fixes. (1) Sidebar wordmark wrapped in `<Link href="/dashboard">` with `hover:opacity-80 transition-opacity` and bumped from `text-lg` to `text-xl`. (2) Color picker swatches changed from `border-transparent` to `border-[var(--color-border)]` at rest. (3) Font picker swatches changed from `border-transparent` to `border-[var(--color-border)]` at rest. Both swatch types retain `border-white scale-110` when selected. The visible border at rest matches the preview panel border, making the Theme section read as a unified group.

**Worked well:** All three changes are class-only edits with no logic changes. The wordmark Link import is the only structural addition.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: wordmark link + consistent swatch borders in theme section`
**Time to merge:**

---

### 2026-03-12 -- Blueprint F -- fix/jobs-filter-tabs

**Built:** Replaced the jobs page stage filter tab active state. Removed `rounded-[var(--radius-button)]` and `bg-[var(--color-elevated)]` pill treatment. Active tab now uses `border-b-2 border-[var(--color-purple-action)]` bottom border accent. Inactive tabs use `border-b-2 border-transparent`. Tab row container gets `border-b border-[var(--color-border)]` to ground the row baseline.

**Worked well:** Bottom-border tab pattern is a well-understood convention. The purple accent matches the brand and the swatch selection ring pattern used elsewhere.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: jobs filter tabs use bottom-border active state`
**Time to merge:**

---

### 2026-03-12 -- Blueprint F -- fix/customer-contact-links

**Built:** Made customer row contact info actionable. Email rendered as `mailto:` link, phone as `tel:` link. Both use `text-[var(--color-muted)]` at rest with `hover:text-[var(--color-text)]` transition. Added `TODO: VERIFY` comment for future customer-filtered jobs view link.

**Worked well:** Simple `<p>` to `<a>` swap with `block` display preserves the existing layout. The `transition-colors hover:text-[var(--color-text)]` pattern provides a subtle hover affordance without introducing underlines or color accents.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: make customer email and phone tappable contact links`
**Time to merge:**

---

### 2026-03-12 -- Blueprint chore -- chore/shared-stage-config

**Built:** Extracted `STAGE_CONFIG` record from the dashboard page into a shared file at `src/app/(app)/_components/stage-config.ts`. Dashboard page imports from the shared file instead of defining the config inline. Added `TODO: VERIFY` comment to the jobs page tabs array for future derivation from `STAGE_CONFIG`.

**Worked well:** Straightforward extraction -- the dashboard `stageConfig` was already the most complete definition. Single rename from `stageConfig` to `STAGE_CONFIG` (module-level constant convention).

**Corrected:** None.

**Root cause:** None.

**Commit:** `chore: extract shared STAGE_CONFIG from dashboard`
**Time to merge:**

---

### 2026-03-12 -- Blueprint F -- fix/ui-polish-logo-avatar

**Built:** Two polish fixes. (1) Estimates page logo increased from `h-10 sm:h-14` to `h-14 sm:h-20` with `max-w-[160px] sm:max-w-[200px]` to constrain wide logos. Class string confirmed as a fully static literal — no template interpolation. (2) Sidebar user avatar radius changed from `rounded-[var(--radius-badge)]` (6px) to `rounded-[var(--radius-button)]` (8px) for more proportionate corners on the `h-8 w-8` element.

**Worked well:** Both are single-line class edits. The logo class was already a static literal so the prior sizing issue was simply undersized values, not a Tailwind extraction failure.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: estimates logo size and sidebar avatar radius`
**Time to merge:**

---

### 2026-03-12 -- Blueprint feat -- feat/photo-capture-overhaul

**Built:** Five fixes to the structured photo capture UI. (1) Required badge contrast: white text on solid brand background replaces near-zero-contrast brand-on-brand-hover. (2) Hardcoded `8` replaced with `REQUIRED_SHOTS.length` in four places (progress text, progress bar width, batch counter, batch color condition). (3) Two `rounded-full` checkmark overlay badges replaced with `rounded-[var(--radius-button)]` per AGENTS.md. (4) Thumbnail strip navigation (13 tiles in 180px container) replaced with step counter (`X / 13`) and two properly styled Previous/Next buttons with ChevronLeft/ChevronRight icons. Previous is a bordered button, Next becomes solid brand when photo is uploaded, bordered Skip when not. (5) Center label shows "Required" or "Optional" below the step counter.

**Worked well:** The step counter + buttons pattern is dramatically simpler than the thumbnail strip and works at all viewport widths. Deriving from `REQUIRED_SHOTS.length` means the shot list can be modified without updating counts in four places.

**Corrected:** None.

**Root cause:** None.

**Commit:** `feat: photo capture UI overhaul -- badge contrast, data-driven counts, navigation redesign`
**Time to merge:**

---

### 2026-03-12 -- Blueprint F -- fix/shell-mobile-overflow

**Built:** Fixed mobile horizontal overflow on all dashboard pages. Added `min-w-0` to the content column flex child so it constrains to available width instead of growing to fit content. Added `overflow-x-hidden` to the `<main>` element to clip any remaining horizontal overflow. Two class additions, no structural changes.

**Worked well:** Classic flex child overflow fix — `min-w-0` is the standard solution for flex items that need to shrink below their content size. Combined with `overflow-x-hidden` on the scrollable main, horizontal overflow is fully contained.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: app shell mobile overflow with min-w-0 and overflow-x-hidden`
**Time to merge:**

---

### 2026-03-13 -- Blueprint F -- fix/sidebar-brand

**Built:** Two sidebar brand identity changes. (1) Top wordmark bumped from `text-xl` to `text-2xl` for more presence in the header slot. (2) Added a brand footer between `</nav>` and the user panel — `text-sm tracking-wide text-[var(--color-muted)] opacity-40` rendering "DetailForge" in flat muted color with no purple accent. Footer is static (not a link) and clearly subordinate to the top wordmark.

**Worked well:** The two instances are visually distinct by design: top is large, full contrast, interactive with purple accent; bottom is small, low contrast, static, flat color. `opacity-40` keeps the footer clearly subordinate.

**Corrected:** None.

**Root cause:** None.

**Commit:** `fix: sidebar wordmark scale and brand footer`
**Time to merge:**

---

### 2026-03-13 -- Blueprint F -- fix/sidebar-brand-footer-text

**Built:** Replaced the sidebar brand footer from a static Lazer84-font "DetailForge" span to a "Powered by DetailForge.io" link matching the estimates page footer treatment. Uses DM Sans (default), `text-xs`, `opacity-50` with `hover:opacity-80` transition. "DetailForge.io" is `font-semibold text-[var(--color-text)]`. Links to `detailforge.io` in a new tab.

**Worked well:** Matching the estimates page footer pattern keeps brand treatment consistent across surfaces. The `<a>` with `target="_blank"` is appropriate here since the footer is a product link, not in-app navigation.

**Corrected:** Previous Blueprint used Lazer84 display font and static text. This was incorrect — the footer should match the "Powered by" treatment used on customer-facing pages.

**Root cause:** BP-SIDEBAR-BRAND-01 spec'd the footer as decorative brand reinforcement using the display font. The correct pattern is the "Powered by DetailForge.io" link treatment already established on the estimates page.

**Commit:** `fix: sidebar brand footer to powered-by link treatment`
**Time to merge:**

---

### 2026-03-17 -- Blueprint chore -- chore/self-hosted-fonts

**Built:** Self-hosted all seven org name picker fonts. Downloaded 13 TTF files (400+700 for six fonts, 400 only for Bebas Neue) to `public/fonts/`. Added 14 `@font-face` declarations to `globals.css` after the existing Lazer84 declaration. Removed `GOOGLE_FONTS_URLS` constant, `fontUrl` derived value, and conditional `<link>` tag from the estimates page. Removed the Google Fonts `useEffect` from branding-form.tsx and the now-unused `useEffect` import.

**Worked well:** Using the Google Fonts CSS API with an old user-agent header returns direct TTF download URLs from `fonts.gstatic.com`, making it straightforward to get the exact static weight files Google serves. The `font-family` values in `@font-face` match the strings used in component `fontFamily` style props, so no component changes needed.

**Corrected:** None.

**Root cause:** None.

**Commit:** `chore: self-host all org name picker fonts`
**Time to merge:**

---

<!-- ADD NEW ENTRIES ABOVE THIS LINE -->
