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

## Blueprint Discipline (Non-Negotiable)
- **Every change requires a Blueprint.** No code changes, no doc changes,
  no config changes without a Blueprint spec reviewed and approved by Ben
  first. No exceptions for "small" or "chore" tasks.
- A Blueprint spec must include: branch name, commit message, files
  affected, errata to apply, and what gets built.
- The Blueprint can be defined in chat, in the v1.1 plan doc, or in a
  standalone doc — but it must exist and be approved before execution.
- After execution, every Blueprint gets a build log entry and a PR
  reviewed by Ben before merge.
- If an agent starts coding without an approved Blueprint, stop
  immediately and ask for one.

### Mandatory Skill Checklist
Every Blueprint execution MUST follow this sequence. Do not skip steps.

1. **Session start** — Run `/cartographer` to build/update the living
   architectural map. Do this before investigating files manually.
2. **Before execution** — Consult forge feed-forward (`patterns.md`)
   for warnings from prior Blueprints relevant to this task.
3. **During execution** — If the Blueprint includes new implementation
   code, use `/test-driven-development` (red-green-refactor).
4. **Before commit** — Run `/quality-gate` to red-team the changes.
   Do not commit until the gate passes or stagnation is detected.
5. **After PR created** — Run `/forge` retrospective immediately.
   Do not end the session without recording the retrospective.

Skipping any step requires explicit approval from Ben. "The task was
too simple" is not a valid reason — simple tasks are where habits form.

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