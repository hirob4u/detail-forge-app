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

<!-- ADD NEW ENTRIES ABOVE THIS LINE -->