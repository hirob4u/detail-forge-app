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

### Blueprint -- Apply Org Branding to Intake Page
### Convention: --color-brand for Customer-Facing Surfaces

**Issue:** Not a bug — a convention established in this Blueprint.

**Root cause:** N/A — design decision.

**Fix applied:** The intake page uses `--color-brand` as its primary action color, not `--color-purple-action`. This CSS custom property is set inline on the page wrapper from the org's `accentColor` value. A companion `--color-brand-hover` is derived via `color-mix(in srgb, accentColor, black 15%)` for hover states. All child components on the intake page (intake form, structured photo capture) reference `--color-brand` and `--color-brand-hover` instead of the DetailForge purple variables. The dashboard always uses DetailForge purple — brand color customization is customer-facing only.

**Add to Blueprint:** Any new UI added to the intake page must use `--color-brand` for primary actions — never hardcode `--color-purple-action` on the intake page. The dashboard always uses DetailForge purple. Brand color customization is customer-facing only. When adding hover states for brand-colored elements, use `--color-brand-hover` (derived via `color-mix()`) rather than computing dark shades in JavaScript.

---

### Blueprint -- Apply Org Branding to Dashboard Sidebar
### Pattern: Server Component Inside Client Layout via Prop Passing

**Issue:** The dashboard layout is a client component (`"use client"`) for sidebar toggle state and pathname tracking. The `SidebarWordmark` component needs to be a server component to query the database directly. Server components cannot be imported into client component files.

**Root cause:** In Next.js App Router, the `"use client"` directive creates a client boundary — all components imported within that file become client components, losing the ability to be async or access server-only APIs.

**Fix applied:** Refactored the layout into three pieces: (1) `layout.tsx` as a server component that composes the shell, (2) `AppShell` as a client component that receives `wordmark` as a React node prop, (3) `SidebarWordmark` as an async server component rendered in the server parent and passed through to the client component. `Suspense` wraps the wordmark with a "DetailForge" text fallback to prevent layout blocking.

**Add to Blueprint:** When a layout needs both client-side interactivity and server-side data fetching, split into: server layout (composes components), client shell (handles interactivity, receives server content as React node props), server data components (async, query DB). Never import async server components directly into `"use client"` files. Always wrap server components in `Suspense` when passed to client components to prevent blocking.

---

### All Blueprints -- Organization ID Resolution
### Issue: Better Auth Org IDs Are Nanoids, Not UUIDs

**Issue:** Better Auth organization IDs are nanoids (e.g. `iYTBtl9yydZWW9As1DP77gOpPsQtJiz3`) not UUIDs. The DetailForge `organizations` table uses UUIDs as primary keys. These are two different ID spaces and must never be used interchangeably. All app data tables (jobs, customers, vehicles) reference the DetailForge UUID as `org_id`. Using the Better Auth nanoid directly as a foreign key returns zero results.

**Root cause:** Better Auth's organization plugin generates its own IDs independently of the application's data layer. The session's `activeOrganizationId` is always a Better Auth nanoid — it is never a valid DetailForge `organizations.id`.

**Fix applied:** Added `betterAuthOrgId` column to the `organizations` table with a unique constraint. Created `getDetailForgeOrgId()` and `getDetailForgeOrg()` utility functions in `src/lib/org.ts`. Updated all server components and API routes to resolve the session org ID through the utility before querying app data tables. Updated the sign-up flow to create a linked DetailForge org record via `/api/org/create` after the Better Auth org is created.

**Add to Blueprint:** Always resolve the Better Auth org ID to the DetailForge UUID using `getDetailForgeOrgId()` before querying jobs, customers, vehicles, or any app data table. The session `activeOrganizationId` is always a Better Auth nanoid — it is never a valid DetailForge `organizations.id`. This distinction must be preserved in every new API route and server component that reads org context from the session. Never use `activeOrganizationId` directly as a foreign key in any app data query. `getDetailForgeOrgId` must be the single point of resolution — do not inline the lookup.

---

### Blueprint -- Organization Branding Settings
### Issue: Free-Form Color Picker Produces Inaccessible Colors

**Issue:** The color picker used `<input type="color">` with a hex text input. Users could select any color, including colors with poor contrast on dark backgrounds (e.g. dark gray, pure black) or colors that conflict with status indicator colors (amber, green, red) already used in the UI.

**Root cause:** Free-form color selection is a power-user feature that creates more problems than it solves for a business tool. Most detailers want to pick a brand color quickly, not fine-tune hex values.

**Fix applied:** Replaced with 7 curated accent color swatches: Purple (#7C4DFF), Blue (#2979FF), Teal (#00BFA5), Orange (#FF6D00), Pink (#F50057), Gold (#FFD600), Lime (#76FF03). All selected for visibility on dark backgrounds and contrast with existing UI status colors.

**Add to Blueprint:** When a Blueprint provides color customization, use curated swatches instead of free-form color input. Curated swatches prevent inaccessible color choices, simplify the UI, and ensure all selected colors work with the existing design system. Each swatch should be tested for contrast on the app's dark background.

---

### Blueprint -- Detailer Review Screen
### Issue: No Photo Viewer in Review Screen

**Issue:** The detailer review screen showed AI flags and the quote builder but did not display the customer's submitted photos. Detailers had no visual reference when reviewing the AI assessment, making it impossible to verify flags against the actual photos.

**Root cause:** The original review screen Blueprint focused on AI assessment display and quote building without considering that the detailer needs to see the photos the AI analyzed.

**Fix applied:** Added a photo viewer section between the vehicle header and the two-column layout. Photos are fetched via `/api/jobs/[jobId]/photos` which generates presigned R2 GET URLs. Grid layout with labeled area tags. Clicking a thumbnail opens a lightbox overlay with keyboard navigation (arrow keys, escape). The lightbox prevents background scrolling and uses `stopPropagation` to prevent close-on-click when interacting with the image.

**Add to Blueprint:** Any review screen where the user evaluates AI output based on uploaded media must display that media alongside the AI output. The reviewer needs to compare the AI's assessment against the source material. Photo display requires presigned GET URLs for private R2 storage -- create a dedicated API route that verifies auth and org ownership before generating URLs.

---

### All Blueprints -- Session Management
### Issue: activeOrganizationId Null on New Sessions

**Issue:** Better Auth's `activeOrganizationId` is null on new sessions -- any device or browser that hasn't manually called `set-active` hits the no-org error on every protected route. This affects mobile, incognito, and new browser sessions.

**Root cause:** Better Auth does not auto-activate an organization on session creation. The `activeOrganizationId` field on the session record starts as null and requires an explicit `set-active` API call. The sign-up flow calls `set-active` after creating the org, but subsequent logins on new devices do not.

**Fix applied:** Next.js middleware (`proxy.ts`) now intercepts protected route requests, detects null `activeOrganizationId` via `auth.api.getSession()`, looks up the user's first org membership via `/api/auth/organization/list`, and calls `/api/auth/organization/set-active` automatically. Errors fail silently -- the request is never blocked by auto-org failures. The middleware must remain in sync with the PROTECTED_PATHS list -- any new top-level authenticated route must be added to both the middleware matcher and the PROTECTED_PREFIXES array.

**Add to Blueprint:** Any Blueprint that adds a new top-level authenticated route (e.g. `/billing`, `/analytics`) must add it to both the `PROTECTED_PREFIXES` array in `proxy.ts` and the `config.matcher` array. The auto-org middleware only runs on paths listed in `PROTECTED_PREFIXES`. Missing a path means that route will not auto-activate the org and users on new sessions will see the no-org error.

---

### Blueprint -- Organization Branding Settings
### Issue: Font Selector Dropdown Does Not Show Actual Typefaces

**Issue:** The font selector was a `<select>` dropdown that showed font names in the browser's default system font. Users had to select a font, then look at the preview below to see what it looked like. This created a trial-and-error loop instead of a single-glance comparison.

**Root cause:** `<select>` elements do not support `fontFamily` styling on `<option>` elements in most browsers. The dropdown is always rendered in the system font regardless of CSS applied to individual options.

**Fix applied:** Replaced the `<select>` with a 2-column grid of font card buttons. Each card renders the font name and "The quick brown fox" sample text using `style={{ fontFamily: font.name }}`. Google Fonts are loaded on mount via `useEffect` that injects `<link>` tags into the document head with dedup by element ID. The preview section below the cards still shows the selected font with the accent color applied.

**Add to Blueprint:** When a Blueprint provides font selection, use visual font cards with sample text rendered in the actual typeface. Never use a `<select>` dropdown for font selection -- browsers cannot render `<option>` elements in custom fonts. Load fonts dynamically via Google Fonts `<link>` injection in a `useEffect` with element ID dedup to prevent duplicate stylesheet loads.

---

### All Blueprints -- Sign-Up Flow
### Convention: Invite-Only Registration

**Issue:** Not a bug -- a deliberate product decision documented here to prevent future Blueprints from removing the invite gate.

**Root cause:** N/A -- intentional design for early access period.

**Fix applied:** Sign-up is invite-only. Never remove the invite code check from the sign-up flow without a deliberate product decision to open registration. Invite codes are marked used only on successful account creation -- not on validation -- to prevent codes being burned by failed sign-ups. The middleware redirect from `/sign-up` to `/waitlist` applies only when no `?code=` param is present -- direct links with a code bypass the redirect and show the sign-up form with the code pre-filled.

**Add to Blueprint:** Sign-up requires a valid invite code. The `/sign-up` route redirects to `/waitlist` unless a `?code=` query param is present. Invite validation is a separate API call (`POST /api/invites/validate`) that does not burn the code -- only successful account creation in `/api/org/create` marks the invite as used. When adding new public routes, add them to `PUBLIC_PREFIXES` in `proxy.ts`. The `/api/invites/` prefix must remain public so unauthenticated users can validate codes during sign-up.

---

### All Blueprints -- Schema Changes
### Issue: Migrations Must Run Against Both Neon Branches

**Issue:** Schema change was pushed to the dev Neon branch only. Production database was out of sync until manually pushed separately.

**Root cause:** `drizzle-kit push` reads `DATABASE_URL` from `.env.local` which points to the dev branch. There is no automatic mechanism to apply the same change to the production branch.

**Fix applied:** Created a temporary `drizzle-prod.config.ts` that reads `DATABASE_URL_PROD` from `.env.local` and ran `drizzle-kit push` against it. Deleted the temp config after confirming success.

**Add to Blueprint:** Any Blueprint that includes a schema change must run migrations against both the dev and production Neon branches explicitly. Dev is the default target via `.env.local`. Production is defined in `.env.local` as `DATABASE_URL_PROD`, running the migration, and ensuring that the local env variables remain the same as before. Never assume a single migration run covers both branches.

---

### All Blueprints -- Layout and Validation
### Issue: Mobile Viewport Height and Optimistic Validation

**Issue:** Two issues. (1) `h-screen` and `min-h-screen` use CSS `100vh` which on mobile browsers includes the browser chrome (address bar, navigation bar), pushing content below the visible area. (2) Invite code validation was optimistic -- the presence of a `?code=` URL parameter set `inviteValid` to `true` before any database check, showing a false green checkmark for invalid or already-used codes.

**Root cause:** (1) CSS `100vh` is a static measurement that does not account for dynamic mobile browser UI. (2) Treating a URL parameter as proof of validity is a client-side trust assumption that bypasses server validation.

**Fix applied:** (1) Replaced `h-screen` with `h-dvh` and `min-h-screen` with `min-h-dvh` across all full-height layouts. `dvh` uses the dynamic viewport height which recalculates as browser chrome shows and hides. (2) Changed `inviteValid` initialization from `!!searchParams.get("code")` to `false`. Added a `useEffect` that auto-validates the code on mount when present in the URL -- green checkmark only appears after the database confirms validity.

**Add to Blueprint:** Never use `h-screen` or `min-h-screen` in DetailForge layouts -- use `h-dvh` and `min-h-dvh` instead. Mobile browsers calculate `100vh` including their chrome which pushes content below the visible area. `dvh` recalculates dynamically as browser UI appears and disappears. This applies to every full-height layout in the app. Additionally, never treat the presence of a URL parameter as proof of validity -- always validate against the database before setting any valid state.

---

### All Blueprints -- Disabled Button Contrast
### Issue: disabled:opacity Produces Illegible Text on Neon Backgrounds

**Issue:** `disabled:opacity-*` Tailwind classes reduce the entire element's opacity. On neon-colored buttons (`bg-[var(--color-purple-action)]`, `bg-[var(--color-brand)]`), this produces a muddy semi-transparent background with washed-out text that is difficult to read against the dark page background.

**Root cause:** Opacity is applied to the entire element including background, border, and text simultaneously. On dark themes with bright accent backgrounds, reduced opacity blends the accent color with the dark page background, producing an intermediate color with poor text contrast.

**Fix applied:** Replaced all 10 `disabled:opacity-*` instances across 7 files with explicit disabled color overrides. Two patterns: (1) Filled buttons: `disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed`. (2) Ghost/outline buttons and inputs: `disabled:text-[var(--color-muted)] disabled:cursor-not-allowed`.

**Add to Blueprint:** Never use `disabled:opacity-*` on any element in DetailForge. Use explicit disabled color overrides instead. Filled buttons: `disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed`. Ghost/outline buttons: `disabled:text-[var(--color-muted)] disabled:cursor-not-allowed`. This ensures disabled states are always legible regardless of the element's enabled-state background color.

---

### All Blueprints -- Job Stage Management
### Convention: Server-Side Stage Transition Validation

**Issue:** Not a bug -- a convention established in this Blueprint.

**Root cause:** N/A -- architecture decision.

**Fix applied:** Stage transitions are validated server-side against `STAGE_TRANSITIONS` in `src/lib/stage-transitions.ts`. The PATCH `/api/jobs/[jobId]/stage` route checks the transition is in the allowed list for the current stage before executing. The client-side `StageControls` component reads the same map for button rendering but the UI is informational only -- the server is the source of truth. Complete is a terminal state with no outbound transitions. Archived jobs can only be restored to Created.

**Add to Blueprint:** Never allow arbitrary stage values in the PATCH `/api/jobs/[jobId]/stage` route -- always check the transition is in the allowed list for the current stage. The `STAGE_TRANSITIONS` map in `src/lib/stage-transitions.ts` is the single source of truth for allowed transitions. Both the API route and the UI component import from it. When adding new stages or transitions, update the map and both consumers will pick up the change automatically.

---

### Blueprint -- QC Photo Upload Screen
### Convention: QC Screen Access and Photo Storage Paths

**Issue:** Not a bug -- a convention established in this Blueprint.

**Root cause:** N/A -- architecture decision.

**Fix applied:** The QC screen is only accessible at `/dashboard/jobs/[jobId]/qc` when `job.stage === 'qc'`. The page server component enforces this and redirects to the job detail page for any other stage. QC after photos are stored in R2 under `qc/[orgId]/[jobId]/` separate from intake photos which live under `intake/[orgSlug]/`. Never mix these paths. The QC checklist is generated once from the AI assessment flags and finalized quote line items, then persisted to `qcChecklist` on the job -- it is not regenerated on subsequent page loads if items already exist.

**Add to Blueprint:** The QC screen must enforce stage gating in its server component -- redirect to job detail if the stage is not `qc`. QC after photos use a separate R2 key prefix (`qc/`) from intake photos (`intake/`). Never store QC photos under the intake prefix. The QC checklist is generated once and persisted -- the `generateQcChecklist` function is only called when `qcChecklist` is empty, not on every page load.

---

### Blueprint F -- Photo Loading Placeholders
### Convention: Shared Photo Display Components

**Issue:** Not a bug -- a convention established in this Blueprint.

**Root cause:** N/A -- architecture decision.

**Fix applied:** All photo thumbnail display across the app uses `PhotoThumbnail` from `src/app/(app)/_components/photo-thumbnail.tsx`. This component handles the loading spinner, opacity-0 to opacity-100 fade-in, error fallback, and area label overlay. The `className` prop allows consumers to override border styling (e.g. green border for QC after photos). For loading states during API fetch, use `PhotoGridSkeleton` from `src/app/(app)/_components/photo-grid-skeleton.tsx` which renders placeholder tiles with spinning indicators. Both components use `aspect-square` to prevent layout shift.

**Add to Blueprint:** When displaying photos in a grid, always use `PhotoThumbnail` -- never inline `<img>` tags with manual loading state. For API-level loading placeholders, use `PhotoGridSkeleton` with a `count` prop matching the expected number of photos. Both components live in `src/app/(app)/_components/` and follow AGENTS.md design token rules (no `rounded-full`, uses CSS custom properties).

---

### Blueprint F -- Two-Phase Photo Loading
### Convention: Photo Loading Is Always Two-Phase

**Issue:** Not a bug -- a performance architecture established in this Blueprint.

**Root cause:** N/A -- architecture decision.

**Fix applied:** Photo loading is always two-phase. Phase 1 calls `/api/jobs/[jobId]/photos/meta` -- DB only, no R2, returns fast. Phase 2 calls `/api/jobs/[jobId]/photos/urls` with the keys from Phase 1 -- generates presigned R2 URLs in parallel. Never combine these into a single blocking call. The `/photos/urls` endpoint validates every requested key against the job's actual photo records before signing -- it must never sign arbitrary keys. QC after photo keys live in `jobs.qcPhotos` and must be included in the key validation set alongside intake photo keys from `jobs.photos`. Area labels are derived from the area key string using `formatAreaLabel` (split on hyphens, capitalize each word) -- never use a hardcoded lookup table.

**Add to Blueprint:** Photo loading is always two-phase. Phase 1 calls `/api/jobs/[jobId]/photos/meta` -- DB only, no R2, returns fast. Phase 2 calls `/api/jobs/[jobId]/photos/urls` with the keys from Phase 1 -- generates presigned R2 URLs in parallel. Never combine these into a single blocking call. The `/photos/urls` endpoint validates every requested key against the job's actual photo records before signing -- it must never sign arbitrary keys. QC after photo keys live in `jobs.qcPhotos` and must be included in the key validation set alongside intake photo keys from `jobs.photos`.

---

### Blueprint F -- R2 Key Structure and Logos Bucket
### Convention: Dual R2 Bucket Architecture

**Issue:** Not a bug -- an infrastructure convention established in this Blueprint.

**Root cause:** N/A -- architecture decision.

**Fix applied:** R2 storage uses two separate buckets. `R2_BUCKET_PHOTOS` (private) stores all intake and QC photos via presigned PUT/GET URLs. `R2_BUCKET_LOGOS` (public) stores organization logos with a public URL (`R2_LOGOS_PUBLIC_URL`). Both buckets share a single `S3Client` instance (`r2`) since they use the same R2 account credentials. Bucket constants `PHOTOS_BUCKET` and `LOGOS_BUCKET` are exported from `src/lib/r2.ts`. Routes that need inline key generation (intake presign, QC upload) import the bucket constant directly. The old `R2_BUCKET_NAME` and `R2_PUBLIC_URL` env vars are fully replaced -- no references remain.

**Add to Blueprint:** R2 uses two buckets: `R2_BUCKET_PHOTOS` (private, presigned URLs) and `R2_BUCKET_LOGOS` (public, direct URL). Import `PHOTOS_BUCKET` or `LOGOS_BUCKET` from `src/lib/r2.ts` -- never reference `process.env.R2_BUCKET_*` directly in route files. Logo public URLs use `NEXT_PUBLIC_LOGOS_URL`. Use `createPresignedUploadUrl` (requires orgId, jobId, area) for job-associated photos and `createPresignedLogoUploadUrl` (requires orgId) for logos. Intake photos generate keys inline because no jobId exists at upload time.

---

### Blueprint F -- Logo URL Environment Variable
### Convention: NEXT_PUBLIC_LOGOS_URL Is the Logo Base URL

**Issue:** Code referenced `R2_LOGOS_PUBLIC_URL` which does not exist. The correct variable is `NEXT_PUBLIC_LOGOS_URL`.

**Root cause:** Previous Blueprint (`fix/r2-key-structure-and-logos-bucket`) invented `R2_LOGOS_PUBLIC_URL` as the env var name without checking the actual environment configuration.

**Fix applied:** Replaced `process.env.R2_LOGOS_PUBLIC_URL` with `process.env.NEXT_PUBLIC_LOGOS_URL` in `src/app/api/org/profile/route.ts`.

**Add to Blueprint:** The public logo base URL environment variable is `NEXT_PUBLIC_LOGOS_URL`. Never use `R2_LOGOS_PUBLIC_URL` -- that variable does not exist in this project. The `NEXT_PUBLIC_` prefix makes the value available on the client side without an API call. Any future code that constructs a logo URL must use `process.env.NEXT_PUBLIC_LOGOS_URL`.

---

### Blueprint F -- Logo and Font Picker
### Convention: Org Branding Placement and Font Swatch Design

**Issue:** Not a bug -- conventions established in this Blueprint.

**Root cause:** N/A -- architecture and design decisions.

**Fix applied:** The org logo and shop name appear together on customer-facing pages only -- estimates page and intake form. The DetailForge wordmark always appears in the dashboard sidebar regardless of org branding settings. Font swatches render the shop name as preview text using the actual font -- never show font names in the UI. The FONTS array and ALLOWED_FONTS server validation must always be kept in sync.

**Add to Blueprint:** Org logo never appears in the dashboard sidebar -- the sidebar always shows the DetailForge wordmark. Logo and shop name always render together as a left-aligned lockup on customer-facing pages (estimates, intake). If no logo is set, the shop name renders alone; if no shop name is set, fall back to org name. Font picker uses an aspect-square swatch grid matching the color picker layout -- each card renders the shop name in the actual font with no font name label. The FONTS constant in `branding-form.tsx` and the `nameFont` enum in `src/lib/validations/org-profile.ts` must always contain the exact same list. Current fonts: DM Sans, Inter, Syne, Barlow, Oswald, Bebas Neue, Montserrat.

---

<!-- ADD NEW ENTRIES ABOVE THIS LINE -->