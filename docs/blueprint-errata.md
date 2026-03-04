# DetailForge -- Blueprint Errata

**Started:** February 2026  
**Builder:** Ben Foran -- Foranware -- detailforge.io  
**Companion to:** Agent-Driven Build Plan v1.0

---

## What This File Is

Every correction round produces a lesson. This file captures those lessons as specific, actionable improvements to the Blueprint templates in the Agent-Driven Build Plan.

The Build Log records what happened. This file records what to do differently next time. Add an entry whenever a correction Blueprint is required. The **Add to Blueprint** field is the most important one -- it is the specific text that should be added to the relevant Blueprint template to prevent the same correction from being needed again.

---

## How This Feeds Back Into the Build Plan

When this file identifies an improvement to a Blueprint template, apply it the next time you run a similar task. If you use this workflow on another project, start by applying all errata improvements to the Blueprint templates before you begin. That is the compounding value of documenting this process.

---

## Entries

---

### Blueprint C -- UI Component / Foundation
### Issue: Lazer 84 Self-Hosted Font

**Issue:** Blueprint skipped Lazer 84 with instruction to add it later. Agent correctly followed this but left no clear path forward, requiring a separate correction Blueprint.

**Root cause:** Blueprint did not specify that Lazer 84 is not available on Google Fonts and must be self-hosted. No `@font-face` declaration or `public/fonts/` directory instruction was provided.

**Fix applied:** Correction Blueprint added `@font-face` declaration in `globals.css` and placed the downloaded `Lazer84.ttf` file in `public/fonts/`. CSS variable `--font-lazer84` now resolves correctly.

**Add to Blueprint:** When Lazer 84 is required, specify that it is not on Google Fonts, must be downloaded from `lazervisuals.com/lazer-84.html`, placed at `public/fonts/Lazer84.ttf`, and loaded via `@font-face` in `globals.css` with `font-display: swap`. Always include this in any Blueprint that sets up the font system.

---

### Blueprint B -- API Route / Server Action (Auth Setup)
### Issue: Next.js 16 -- middleware.ts Deprecated

**Issue:** Agent created `src/middleware.ts` following the standard Next.js convention. Next.js 16 renamed this file to `proxy.ts`. The dev server showed a deprecation warning and route protection did not behave as expected.

**Root cause:** Next.js 16 was released after much of the model's training data was collected. The `middleware.ts` to `proxy.ts` rename is a recent breaking change the agent does not know as default behavior.

**Fix applied:** Correction Blueprint renamed `src/middleware.ts` to `src/proxy.ts`. Logic was unchanged.

**Add to Blueprint:** Add to all Blueprints that involve middleware or route protection: "This project uses Next.js 16. The middleware file is `src/proxy.ts`, not `src/middleware.ts`. Do not create `middleware.ts`."

---

### Blueprint B -- API Route / Server Action (Auth Setup)
### Issue: Better Auth Drizzle Adapter -- Schema Object Required

**Issue:** Better Auth threw `BetterAuthError` on sign-up: "The model user was not found in the schema object. Please pass the schema directly to the adapter options." Sign-up returned a 500 error.

**Root cause:** Blueprint did not specify that Better Auth requires its own database tables (user, session, account, verification) to be added to the Drizzle schema, and that the full schema object must be passed directly to the Drizzle adapter -- not just the database client.

**Fix applied:** Correction Blueprint added Better Auth's required tables to `src/lib/db/schema.ts`, ran `drizzle-kit generate` and `drizzle-kit migrate` to create them in Neon, and updated `src/lib/auth.ts` to pass the full schema object to the adapter using `drizzleAdapter(db, { provider: 'pg', schema })`.

**Add to Blueprint:** Add to Blueprint B when setting up Better Auth: "Better Auth requires its own tables in the Drizzle schema: user, session, account, and verification. Add these to `src/lib/db/schema.ts` before configuring the adapter. Pass the full schema object to the Drizzle adapter: `drizzleAdapter(db, { provider: 'pg', schema })` where schema is imported as `import * as schema from './db/schema'`. Run `drizzle-kit generate` and `drizzle-kit migrate` after updating the schema."

---

### Blueprint A -- New Screen (New Estimate)
### Issue: Core Value Proposition Misread -- Customer vs. Detailer Upload

**Issue:** Blueprint A was written with the detailer uploading vehicle photos to generate an estimate. This is the exact workflow DetailForge is meant to eliminate. The entire pitch is that the customer uploads photos and gets a preliminary AI estimate before the detailer is involved -- removing the back-and-forth over DM and text. Blueprint was cancelled before any code merged.

**Root cause:** The Product Spec described the estimation flow without clearly stating who initiates it. The phrase "photo upload" was ambiguous. The Brand Identity doc actually had this correct -- the Customer Intake mockup clearly shows a customer-facing public form with the detailer's brand leading and "powered by DetailForge" as a small mark. The spec and build plan were not explicit enough about the two-surface architecture: a public unauthenticated customer intake form and a separate authenticated detailer review screen.

**Fix applied:** All docs updated. Product Spec rewritten to make the customer-first flow explicit. Build Plan Phase 1 rewritten as two separate Blueprint tasks. Build Log entry added for the aborted Blueprint.

**Add to Blueprint:** Any Blueprint involving the estimation flow must specify which surface is being built -- public customer intake (no auth, detailer's brand leads) or authenticated detailer review. These are two separate screens with different routes, different auth requirements, and different audiences. Never combine them into one Blueprint task. The public intake route lives at `/[orgSlug]/estimate` or similar. The detailer review route lives inside the authenticated app shell.

---

### Blueprint A -- New Screen / Blueprint B -- API Route
### Issue: R2 Bucket CORS Policy Required for Browser-Side Uploads

**Issue:** Photo uploads from the browser failed with "Fetch API cannot load ... due to access control checks." even after the R2 endpoint was correctly configured. The browser blocks direct PUT requests to R2 from any origin not explicitly allowed.

**Root cause:** Cloudflare R2 buckets have no CORS policy by default. Browser-side presigned URL uploads require an explicit CORS policy on the bucket before any PUT request from a browser will succeed. This is a bucket-level infrastructure requirement, not a code issue.

**Fix applied:** Added CORS policy to the `detailforge-photos` bucket in Cloudflare dashboard under R2 > detailforge-photos > Settings > CORS Policy:
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://detailforge.io",
      "https://*.detailforge.io"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**Add to Blueprint:** Any Blueprint involving browser-side file uploads to R2 via presigned URLs must include this note: "The R2 bucket requires a CORS policy configured in the Cloudflare dashboard before browser uploads will work. Verify the CORS policy includes the current environment origin (localhost:3000 for dev, detailforge.io for prod) before testing uploads. This is a one-time bucket setup -- not a code change."

---

### Blueprint B -- API Route (Presigned URL Generation)
### Issue: PutObjectCommand ContentLength Breaks Browser Uploads

Issue: Presigned URLs included content-length in X-Amz-SignedHeaders.
R2 rejected browser PUT requests with a 403 because the browser-controlled
content-length didn't match the signed value.

Root cause: PutObjectCommand was instantiated with a ContentLength property.
Including ContentLength forces it into the signed headers. Browser uploads
must not sign content-length because the browser sets that value at upload time.

Fix applied: Removed ContentLength from PutObjectCommand. Command now only
includes Bucket, Key, and ContentType.

Add to Blueprint: Never include ContentLength in PutObjectCommand when
generating presigned URLs for browser-side uploads. The browser controls
content-length -- signing it will always cause a 403.

---

### Blueprint A / Blueprint D -- Photo Storage and R2 Access Model
### Issue: Public URLs Stored Instead of Object Keys

**Issue:** Presign route returned a publicUrl alongside the presignedUrl. The intake form stored these public URLs in the photos JSONB column. The analyze route received URLs instead of R2 object keys, making SDK-based fetching impossible. Photos were effectively public to anyone with the URL.

**Root cause:** The R2 utility generated a publicUrl from an R2_PUBLIC_URL env var, treating the bucket as publicly accessible. The entire photo storage model was built around public access instead of private SDK-based access with presigned URLs.

**Fix applied:** Removed publicUrl from the presign response and R2 utility. Presign route now returns `{ presignedUrl, key }`. PhotoUploader stores R2 object keys instead of URLs. Intake submit stores photos as structured objects `{ key, phase, area }`. Analyze route fetches photos from R2 via SDK using credentials. No public URLs exist anywhere in the codebase.

**Add to Blueprint:** R2 buckets must be private. Never store public URLs -- store object keys only. The presign route returns a key for storage and a presigned URL for upload only. Displaying photos in the UI requires generating a presigned GET URL on demand. The analyze route fetches photos directly from R2 via the SDK using credentials.

---

### Blueprint A -- Customer Intake Form
### Issue: Single Photo Upload Zone Produces Incomplete AI Assessments

**Issue:** The intake form had a single generic photo upload zone. Customers uploaded whatever photos were convenient, often skipping interior shots entirely. This produced incomplete AI assessments because the model lacked interior photo coverage.

**Root cause:** Blueprint A specified a single PhotoUploader component without distinguishing between exterior and interior photos. Users defaulted to the easiest shots (exterior front/rear) and skipped areas that require more effort to photograph (interior, wheels, close-ups).

**Fix applied:** Split the photo upload section into two explicit zones -- Exterior Photos (min 2, max 8) and Interior Photos (min 1, max 4). Each zone has its own label, guidance text, minimum requirement, and visual accent. Submit button is disabled until both minimums are met.

**Add to Blueprint:** Photo upload sections should always be split by context when the AI assessment depends on coverage of distinct areas. A single generic upload zone produces incomplete assessments because users default to the easiest shots. Explicit labeled sections with minimums and guidance text produce consistently better AI input.

---

### Blueprint A -- Customer Intake Form
### Issue: Photo Upload Zone Layout Sparse Before Photos Added

**Issue:** Photo upload sections rendered as large empty boxes with a full-card dashed border. Before any photos were added the sections looked sparse and unpolished, wasting vertical space.

**Root cause:** The "Add photo" tile was styled as a full-width dashed border wrapper around the grid area rather than as an equal-sized grid tile alongside thumbnails. The counter sat below the grid instead of inline with the section label.

**Fix applied:** Restructured the component so the "Add photo" tile is an equal-sized square in the same `grid-cols-3 gap-2 sm:grid-cols-4` grid as thumbnails. Dashed border is only on that tile. Counter moved inline with label at top-right in JetBrains Mono. Card wrapper uses `border-l-2` with accent color, no background elevation, and only `p-4` padding.

**Add to Blueprint:** Upload zone UI should be grid-first: the "add" tile is the same size as thumbnails and sits in the photo grid. Never wrap the entire upload area in a dashed border -- dashed borders only go on the "add" tile. Counter text goes inline with the section label, not below the grid.

---

### Blueprint A -- New Screen (Customer Intake)
### Issue: Generic Photo Upload Produces Inconsistent AI Assessment Quality

**Issue:** A single upload zone or two-section upload zone (Exterior/Interior) gives the customer no guidance on what shots to take. Coverage is unpredictable. The AI receives unlabeled photos and has to guess what it is looking at, reducing assessment accuracy and confidence scores.

**Root cause:** The original Blueprint treated photo upload as a file collection problem rather than a data quality problem. The AI assessment is only as good as the photo input. Without structured, labeled shots the model cannot apply area-specific assessment criteria.

**Fix applied:** Replace generic upload with structured photo capture. Each required shot has a defined label, purpose, guidance text, and area tag. The area tag is stored with the photo key in the JSONB column and passed to the AI prompt so the model knows exactly what it is analyzing for each photo. Required shots: driver side, passenger side, front, rear, hood, driver seat / interior forward, rear seat, dashboard. Optional shots: specific damage area, wheel close-up, trunk/cargo, headliner, engine bay.

**Add to Blueprint:** Any Blueprint involving photo upload for AI analysis must use structured capture with labeled shots and area tags. Never use a generic upload zone when the AI needs to assess specific areas. The photo storage schema must include an area field. The AI prompt must receive photo area labels and apply area-specific assessment criteria per shot.

---

### Blueprint A -- Structured Photo Capture
### Issue: Validation Schema Must Match New Data Format

**Issue:** Blueprint specified "do not change the intake submit route" but also instructed the parent form to pass `{ key, area, phase }` structured objects as the `photoKeys` field. The existing Zod schema validated `photoKeys` as `z.array(z.string())`, which rejects objects.

**Root cause:** Blueprint assumed the route "already has the { key, area, phase } structure" when in fact the route was mapping plain string keys to structured objects. When the input format changes, the validation layer must change with it.

**Fix applied:** Updated `intakeSubmitSchema` to validate `photoKeys` as `z.array(z.object({ key, area, phase }))`. Updated submit route to pass `data.photoKeys` directly to the photos column instead of mapping strings.

**Add to Blueprint:** When a Blueprint changes the data format sent from a client component to an API route, the validation schema and route handler must be listed as affected files even if the route's core logic (transaction pattern, org lookup, error handling) stays the same. "Do not change the route" should mean "do not change the route's architecture" not "do not update the validation to match the new payload shape."

---

### Blueprint A -- Structured Photo Capture
### Issue: Grid Tiles Unreadable on Mobile -- Guided and Batch Modes Required

**Issue:** Structured photo capture rendered all 13 shots as small square tiles in a grid. Labels and guidance text were truncated or unreadable at 375px. The Blueprint specified two modes (guided step-by-step and batch upload) but the initial implementation used only the grid layout.

**Root cause:** The grid layout was the simplest implementation path and was chosen over the specified two-mode design. Small square tiles cannot fit a label, guidance text, and upload zone at mobile widths. The guided mode was the correct default for mobile-first customers uploading photos from a phone camera.

**Fix applied:** Replaced the grid layout with a mode toggle. Guided mode shows one full-width shot card at a time with large upload zone, progress bar, navigation buttons, and thumbnail strip. Batch mode shows a vertical card list with horizontal layout (text left, upload zone right). Both modes share the same state so switching preserves uploads.

**Add to Blueprint:** Any Blueprint involving structured photo capture must specify the render mode. Grid layouts work for desktop dashboards where tiles are 150px+ but not for mobile-first intake forms. For customer-facing photo capture on mobile devices, use guided mode (one shot at a time, full width) as the default. Always provide a batch mode alternative for power users. Hidden file inputs should be shared via a ref map and rendered once, not per-tile.

---

### All Blueprints -- Cloudflare Pages Deployment Adapter
### Issue: Wrong Adapter -- next-on-pages Requires Edge Runtime

**Issue:** `@cloudflare/next-on-pages` requires `export const runtime = 'edge'` on every non-static route. Edge Runtime breaks the AWS SDK (`@aws-sdk/client-s3`), Node.js stream APIs, and many Next.js features. The project was not deployable to Cloudflare Pages with this adapter.

**Root cause:** `@cloudflare/next-on-pages` was chosen without verifying Edge Runtime compatibility with the project's dependencies (AWS SDK, Anthropic SDK, Node.js Buffer/streams). The correct adapter is `@opennextjs/cloudflare` which runs on Node.js runtime with the `nodejs_compat` compatibility flag.

**Fix applied:** Replaced `@cloudflare/next-on-pages` with `@opennextjs/cloudflare` and `wrangler`. Created `wrangler.jsonc` with `nodejs_compat` flag, `open-next.config.ts`, and `public/_headers`. Removed all `export const runtime = 'edge'` exports. Added `optimizePackageImports` to `next.config.ts` for bundle size. Converted DB to factory function for Workers request isolation.

**Add to Blueprint:** Cloudflare Pages Next.js deployment requires `@opennextjs/cloudflare` not `@cloudflare/next-on-pages`. The next-on-pages adapter requires Edge Runtime which breaks the AWS SDK and many Next.js features. The opennextjs adapter uses Node.js runtime with `nodejs_compat` flag which supports the full stack. Never add `export const runtime = 'edge'` to any route when using `@opennextjs/cloudflare`. Bundle size must stay under 25MB -- use `optimizePackageImports` for heavy packages like the AWS SDK and Anthropic SDK.

---

### All Blueprints -- Deployment Infrastructure
### Issue: Premature Deployment Adapter Configuration

**Issue:** Cloudflare deployment infrastructure (`@opennextjs/cloudflare`, `wrangler`, `wrangler.jsonc`, `open-next.config.ts`, `optimizePackageImports`, Cloudflare-specific scripts) was added before the deployment target was finalized. This added complexity and config files without being needed.

**Root cause:** Deployment adapter was treated as a Blueprint F fix when it should have been a dedicated deployment Blueprint with its own acceptance criteria including a successful deploy.

**Fix applied:** Removed all Cloudflare-specific packages, config files, and scripts. Reverted `next.config.ts` to minimal config. Codebase is deployment-target-neutral.

**Add to Blueprint:** Do not add deployment adapter infrastructure until the deployment target is finalized and a full deploy test is part of the acceptance criteria. Deployment config should be its own Blueprint task, not a bug fix. Keep the codebase deployment-target-neutral until ready to deploy.

---

### Blueprint D -- API Route (Analyze)
### Issue: Hardcoded System Prompt Prevents Iteration Without Deploys

**Issue:** The condition assessment system prompt was hardcoded as a `SYSTEM_PROMPT` constant in the analyze route. Every prompt change required a code change and redeployment.

**Root cause:** The original Blueprint D treated the system prompt as code rather than data. Prompt engineering is iterative and the prompt will change frequently as assessment quality is tuned. Embedding it in the route handler couples prompt changes to the deploy cycle.

**Fix applied:** Created a `prompts` table in the database with name, version, content, and active flag. The analyze route fetches the active prompt by name at request time. A seed script (`scripts/seed-prompt.ts`) reads from `scripts/prompt-content.txt` and inserts a new versioned row, deactivating previous versions. Prompt updates are now: edit the text file, run `npm run seed:prompt`, done.

**Add to Blueprint:** Any Blueprint that involves an LLM system prompt must store the prompt in the database, not in code. Create a `prompts` table with name, version, content, and active columns. The API route fetches the active prompt by name at request time. Provide a seed script that reads from a plain text file and inserts a new version. Never hardcode LLM prompts in route handlers or constants.

---

### All Blueprints -- Scripts
### Issue: ES Module Import Hoisting Breaks dotenv in Seed Scripts

**Issue:** Seed script using `import { db } from "../src/lib/db"` at the top level failed with "No database connection string" even though `dotenv.config({ path: ".env.local" })` was called before the DB was used.

**Root cause:** ES module static imports are hoisted -- they execute before any imperative code in the file. The DB module reads `process.env.DATABASE_URL` at import time. `dotenv.config()` runs after all static imports have resolved, so the env var is not set yet when the DB module initializes.

**Fix applied:** Restructured seed script to use `await import()` dynamic imports inside the async function body. Only `dotenv` itself is a static import (it has no env dependencies). All other imports (`db`, `schema`, `drizzle-orm`) are dynamically imported after `dotenv.config()` has run.

**Add to Blueprint:** Any Blueprint that includes a standalone script (seed, migration, utility) must use dynamic `await import()` for any module that reads environment variables at initialization time. Static `import` is only safe for modules with no env dependencies (like `dotenv` itself, `fs`, `path`). Pattern: `import dotenv from "dotenv"; dotenv.config({ path: ".env.local" }); async function main() { const { db } = await import("../src/lib/db"); ... }`.

---

### Blueprint -- Detailer Review Screen
### Decision: AI Scores Not Displayed in Review UI

**Issue:** Not a bug -- a deliberate product decision documented here to prevent future Blueprints from adding score display to the review screen.

**Root cause:** N/A -- intentional design.

**Fix applied:** The review screen displays AI flags and recommended services but does not display raw numerical scores (paintCondition, scratchSeverity, contamination, interior, wheelsTrim). Detailers need actionable flags and service recommendations, not abstract 1-10 numbers. Scores are stored in `aiAssessment` for future analytics use (trend analysis, prompt quality tracking) but are not surfaced in the detailer-facing review UI.

**Add to Blueprint:** The review screen intentionally does not display raw AI scores -- detailers need actionable flags, not numerical scores. Scores are stored in `aiAssessment` for future analytics use but are not surfaced in the review UI. This is a deliberate product decision. Do not add score display to the review screen without explicit product approval.

---

### All Blueprints -- Background AI Analysis
### Issue: Never Await Long-Running AI Calls From Intake Routes

**Issue:** The analyze route takes 15-30 seconds to complete (R2 photo fetch + Claude API call + JSON parsing). Awaiting this from the intake submit route would block the customer's browser and risk a serverless function timeout on Vercel or Cloudflare.

**Root cause:** AI analysis is a long-running operation that must not block user-facing request/response cycles. The intake form needs to return immediately after creating the job records.

**Fix applied:** Fire-and-forget `fetch` from the intake submit route -- the analyze call runs in the background without blocking the response. A dedicated `analysisStatus` column on the jobs table tracks progress (`processing` → `complete` | `failed`). The analyze route sets the status on entry and on every exit path (success or error). A lightweight polling endpoint (`/api/jobs/[jobId]/status`) returns only status fields so the client can poll without pulling full assessment data. The `AnalysisStatusPanel` client component polls every 3 seconds and transitions between states without a page reload.

**Add to Blueprint:** Never await long-running AI calls from intake submission routes on Vercel. The default function timeout will kill the request before the analysis completes. Use fire-and-forget `fetch` with a dedicated status column to communicate progress to the UI. The polling endpoint must be lightweight -- select only the status fields, never join photos or full assessment data in a polling route.

---

### Blueprint D -- API Route (Analyze)
### Issue: iPhone Photos Exceed Claude Vision API Size Limit and photoKeys Type Mismatch

**Issue:** Two bugs. (1) Raw iPhone photos at 12MP are 4-8MB each. Claude Vision API has a 5MB per image hard limit — requests with large photos fail silently or error. (2) The intake submit route sends `photoKeys` as `{ key, area, phase }[]` structured objects, but the analyze route typed them as `string[]`. Without explicit key extraction, JS coerces the object to the string `[object Object]` when used as an R2 key, causing all photo fetches to fail.

**Root cause:** (1) No image processing step existed between R2 fetch and Claude API submission. Photos were base64-encoded at full resolution. (2) The analyze route was written before the structured photo capture format existed. The `photoKeys` type was never updated to match the new `{ key, area, phase }` format.

**Fix applied:** (1) Added `sharp` to resize all photos to 800px wide at 75% JPEG quality before base64 encoding. Reduces a 6MB photo to ~150KB while retaining sufficient detail for visual assessment. `sharp` handles HEIC, PNG, and JPEG inputs transparently. (2) Updated `photoKeys` type to `Array<string | { key, area, phase }>` and added defensive extraction: `typeof k === 'string' ? k : k.key`.

**Add to Blueprint:** iPhone photos from R2 must be resized with `sharp` before base64 encoding for Claude Vision API. Raw iPhone photos exceed Claude's 5MB per image hard limit. Resize to 800px wide at 75% JPEG quality — reduces a 6MB photo to roughly 150KB while retaining sufficient detail for visual assessment. The analyze route must also handle `photoKeys` as both `string[]` and `{ key, area, phase }[]` since the intake form stores structured objects but manual triggers may pass plain strings. Always extract the key property defensively.

---

### All Blueprints -- Route Group Layout
### Issue: Authenticated Pages Must Live Inside (app) Route Group

**Issue:** Dashboard job detail and review pages were initially created at `src/app/dashboard/jobs/[jobId]/` — outside the `(app)` route group. These pages did not receive the sidebar layout from `(app)/layout.tsx` and rendered without navigation.

**Root cause:** Next.js route groups (parenthesized directories like `(app)`) scope layouts. Only pages inside `src/app/(app)/` receive the sidebar layout. Pages at `src/app/dashboard/` are siblings of `(app)`, not children, so they get the root layout only.

**Fix applied:** Moved all dashboard pages from `src/app/dashboard/` into `src/app/(app)/dashboard/`. The URL path is unchanged (`/dashboard/jobs/[jobId]`) because route groups don't affect URLs — they only affect layout scoping.

**Add to Blueprint:** All authenticated app pages must live inside the `(app)` route group at `src/app/(app)/` to receive the sidebar layout from `(app)/layout.tsx`. Pages placed at `src/app/dashboard/` or other top-level directories outside `(app)/` will not receive the sidebar and will render without navigation. This applies to every new authenticated page in the codebase.

---

### Blueprint -- Organization Branding Settings
### Decision: R2_PUBLIC_URL for Logo Display

**Issue:** Not a bug — a design decision. Logo URLs are constructed server-side from `R2_PUBLIC_URL` + logo key when the PATCH is saved. This assumes the R2 bucket has a public custom domain configured for logo display on the intake form. If the bucket remains private, logos would need presigned GET URLs generated on demand instead.

**Root cause:** N/A — architecture note for future reference.

**Fix applied:** The PATCH route constructs `logoUrl = R2_PUBLIC_URL/key` when a `logoKey` is set. If `R2_PUBLIC_URL` is not configured, the `logoUrl` will not be set. The intake form should use `logoUrl` when available, falling back to the org name as text.

**Add to Blueprint:** When a Blueprint stores files in R2 that need to be displayed publicly (logos, branding assets), document whether the bucket requires a public domain. Photo storage for AI analysis should always remain private (presigned GET on demand). Logo/branding assets can use a public URL if configured.

---

<!-- ADD NEW ENTRIES ABOVE THIS LINE -->