# DetailForge -- Agent Instructions

## Stack
Next.js App Router, React, TypeScript (strict), Tailwind v4,
shadcn/ui, Better Auth, Stripe, Claude API, Neon PostgreSQL,
Cloudflare Pages + R2.

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