# DetailForge -- Agent Instructions

## Stack
Next.js App Router, React, TypeScript (strict), Tailwind v4,
shadcn/ui, Better Auth, Stripe, Claude API, Neon PostgreSQL,
Vercel + Cloudflare R2.

## Working Directory
- Before writing any code or running any commands, verify you are in the
  project root: /Users/bforan/Development/DetailForge/detail-forge-app
- All npm commands must be run from this directory
- If unsure, run pwd and confirm before proceeding
- Never run npm install, npm run dev, or any build commands from a parent directory

## Non-Negotiable Rules
- Import all color, font, spacing, and radius values from
  lib/design-tokens.ts. Never hardcode design values.
- Reference lib/schema.ts for all database entity types.
  Never guess column names.
- Dark mode only. No light mode variants. No conditional
  class for dark: prefix at the root level.
- TypeScript strict. Zero 'any'. Fix all TS errors before
  task completion.
- ESLint must pass clean before task completion.
- DM Sans for all UI text. JetBrains Mono for numbers,
  metrics, status badges. Lazer 84 for wordmark only.
- Magenta (#E040FB) is reserved for AI-generated content
  indicators. Use it nowhere else.
- Border radius: 12px cards, 8px buttons/inputs, 6px badges.
- No rounded-full pill shapes anywhere.
- Status badges use JetBrains Mono, 11px, uppercase, with
  semantic neon colors per the Style Guide badge system.
- Use `dvh` not `vh` for mobile viewport height.
- Customer-facing pages use `--color-brand` for primary actions.
  Dashboard pages use `--color-purple-action`. Never hardcode
  `--color-purple-action` on intake pages.
- Use `color-mix()` for hover shades. Never compute dark shades
  in JavaScript.
- Color customization uses curated swatches, not free-form input.
  Every swatch must be tested for contrast on the dark background.
- Font selection uses visual font cards with sample text rendered
  in the actual typeface. Never use `<select>` dropdowns for font
  selection -- browsers cannot render custom fonts in `<option>`.
  Load fonts dynamically via Google Fonts `<link>` injection in
  `useEffect` with element ID dedup to prevent duplicate loads.

## Routing & Auth
- This project uses Next.js 16. The middleware file is
  `src/proxy.ts`, not `src/middleware.ts`. Do not create
  `middleware.ts`.
- All authenticated app pages must live inside the `(app)` route
  group at `src/app/(app)/` to receive the sidebar layout. Pages
  outside `(app)/` will not receive the sidebar.
- Every new authenticated route must be added to both
  `PROTECTED_PREFIXES` and `config.matcher` in `proxy.ts`.
  Missing a path means no org auto-activation on that route.
- Public routes (no auth) must be added to `PUBLIC_PREFIXES` in
  `proxy.ts`.
- Sign-up requires a valid invite code. The `/sign-up` route
  redirects to `/waitlist` unless a `?code=` query param is
  present. Invite validation via `POST /api/invites/validate`
  does not burn the code -- only `/api/org/create` marks it used.

## Org Identity
- Always resolve the Better Auth org ID to the DetailForge UUID
  using `getDetailForgeOrgId()` from `src/lib/org.ts` before
  querying jobs, customers, vehicles, or any app data table.
- The session `activeOrganizationId` is always a Better Auth
  nanoid -- it is never a valid DetailForge `organizations.id`.
- Never use `activeOrganizationId` directly as a foreign key.
  `getDetailForgeOrgId()` must be the single point of resolution.

## AI & Photos
- Store all LLM prompts in the database `prompts` table. Never
  hardcode prompts in route handlers or constants. Seed via
  `scripts/seed-prompt.ts` reading from `scripts/prompt-content.txt`.
- iPhone photos from R2 must be resized with `sharp` before
  base64 encoding for Claude Vision API. Resize to 800px wide
  at 75% JPEG quality. Raw iPhone photos exceed Claude's 5MB
  per image limit.
- Handle `photoKeys` as both `string[]` and `{ key, area, phase }[]`
  since intake stores structured objects but manual triggers may
  pass plain strings. Always extract the key property defensively.
- Never await long-running AI calls from intake submission routes
  on Vercel. Use fire-and-forget `fetch` with a dedicated status
  column and lightweight polling endpoint. Select only status
  fields in the polling route -- never join photos or full
  assessment data.
- Use `stripMarkdownFences()` when parsing JSON from Claude
  responses. Model is `claude-sonnet-4-5`.

## R2 Storage
- R2 buckets must be private. Never store public URLs -- store
  object keys only. Displaying photos requires presigned GET URLs
  generated on demand via authenticated API routes.
- Never include ContentLength in PutObjectCommand for presigned
  uploads. Browser upload content-length never matches a
  pre-signed value.
- The R2 bucket requires a CORS policy configured in the
  Cloudflare dashboard. Verify the CORS policy includes the
  current environment origin before testing uploads.
- When a Blueprint stores files that need public display (logos),
  document whether the bucket requires a public domain.

## UI Patterns
- Photo upload for AI analysis must use structured capture with
  labeled shots and area tags. Never use a generic upload zone
  when the AI needs to assess specific areas.
- Grid layouts for photo tiles work at 150px+ (desktop). For
  mobile-first intake, use guided mode (one shot at a time, full
  width) as default with batch mode for power users.
- The "add" tile in upload zones sits in the photo grid at the
  same size as thumbnails. Dashed borders only on the "add" tile,
  never wrapping the entire upload area.
- Review screens that evaluate AI output must display the source
  media alongside the assessment. Photo display requires presigned
  GET URLs via an auth-verified API route.
- The review screen does not display raw AI scores. Scores are
  stored in `aiAssessment` for analytics but the UI shows
  actionable flags. Do not add score display without product
  approval.
- When a Blueprint changes the payload shape from client to API,
  the validation schema and route handler are affected files even
  if the route architecture stays the same.
- When a layout needs both client interactivity and server data,
  split into: server layout, client shell (receives server content
  as React node props), server data components. Never import async
  server components into `"use client"` files. Wrap server
  components in `Suspense` when passed to client components.

## Scripts & Utilities
- Standalone scripts (seed, migration, utility) must use dynamic
  `await import()` for modules that read env vars at init time.
  Pattern: `import dotenv from "dotenv"; dotenv.config({ path:
  ".env.local" }); async function main() { const { db } = await
  import("../src/lib/db"); ... }`.
- Do not add deployment adapter infrastructure until the deploy
  target is finalized. Deployment config should be its own
  Blueprint, not a fix task.

## When You Are Unsure
If a spec detail is ambiguous, use the most conservative
interpretation and leave a comment flagged with TODO: VERIFY
so the human reviewer can make the call.

## Database
- Two Neon branches exist: dev (local) and main (production)
- .env.local `DATABASE_URL` always points to the dev branch
- .env.local `DATABASE_URL_PROD` contains the production connection string
- Vercel `DATABASE_URL` always points to the production branch
- Every schema change Blueprint must run `drizzle-kit migrate` against both branches
- Run dev first (default `drizzle.config.ts` uses `DATABASE_URL`), then create
  a temporary `drizzle-prod.config.ts` that reads `DATABASE_URL_PROD` from
  `.env.local`, run `npx drizzle-kit migrate --config drizzle-prod.config.ts`,
  then delete the temp config file. Never commit the prod config.
- Never run migrations from a parent directory
- Do NOT use `drizzle-kit push` for schema changes -- it bypasses the
  migration tracking table and causes `drizzle-kit migrate` to fail on
  subsequent runs

## Schema Migrations
- Every migration SQL file must be idempotent
- Use `ADD COLUMN IF NOT EXISTS` for all column additions
- Use `CREATE TABLE IF NOT EXISTS` for all new tables
- After generating a migration with `drizzle-kit generate`, verify the output
  uses `IF NOT EXISTS` patterns -- edit the generated SQL if it does not
- Run `drizzle-kit migrate` against both Neon dev and main branches
- Verify `drizzle.__drizzle_migrations` tracking table has the new entry
  on both branches after migration
- Drizzle stores SHA256 hashes of SQL file content in the tracking table --
  if you edit a migration file after it has been applied, the hash will change
  and Drizzle will try to re-apply it. Only edit migration files that have
  not yet been applied.

## V1.1 Reference Docs
Before starting any v1.1 Blueprint, read the relevant decision doc:
- `docs/v1.1-methodology-engine.md` -- Detailer Methodology Engine,
  interior/exterior parity, and full Blueprint sequence
- `docs/v1.1-baseline-architecture.md` -- Baseline-first estimate
  architecture
- `docs/v1.1-supply-cabinet.md` -- Supply cabinet via photo,
  job recommendations, reorder reminders

## AI Assessment Architecture
- AI prompts are assembled dynamically from three layers:
  Layer 1 (Foundation) + Layer 2 (Detailer Methodology) +
  Layer 3 (Learned Adjustments). See `docs/v1.1-methodology-engine.md`.
- Never hardcode pricing ranges, service names, or correction
  protocols into the foundation prompt -- these belong in the
  per-org methodology layer.
- AI assessment scoring must give interior and exterior equal
  depth. Interior has 7 scoring dimensions. Exterior has 4.
  Never collapse interior into a single score.
- The foundation prompt covers: scoring rubric, output schema,
  safety guardrails, professional writing standard.
- The methodology layer covers: service menu, pricing rules,
  inspection focus, correction protocols, product preferences.

## Crucible Skills
Four skills from raddue/crucible are installed globally at ~/.claude/skills/.
Use them during Blueprint execution as follows:

- **cartographer** — Run at the start of every session to build/update the
  living architectural map. Eliminates cold-start codebase exploration.
  Invoke: `/cartographer`
- **quality-gate** — Run before marking any Blueprint complete. Iterative
  red-teaming with fix memory catches issues before they become correction
  Blueprints. Invoke: `/quality-gate`
- **test-driven-development** — Use for all new implementation work.
  Enforces red-green-refactor discipline. Invoke: `/test-driven-development`
- **forge** — Run after completing a Blueprint. Extracts lessons and proposes
  process improvements, automating what Blueprint Errata does manually.
  Invoke: `/forge`

Do NOT use Crucible's build, design, or planning skills — the Blueprint
methodology handles orchestration. These four skills augment execution only.

## Git Workflow
- Before creating any branch, always sync with remote main first:
  git checkout main && git pull origin main
  This is mandatory. Never create a branch from a stale local main.
- Never commit directly to main
- Branch naming: type/short-descriptor
  - feat/ for new screens and components
  - api/ for server actions and API routes
  - schema/ for data layer changes
  - fix/ for correction tasks
  - chore/ for config and tooling
- One Blueprint task per branch
- All branches merge to main via PR