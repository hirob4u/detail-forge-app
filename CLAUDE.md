# DetailForge — Agent Instructions

**READ `AGENTS.md` BEFORE DOING ANYTHING.** This is mandatory. Every session, every task, no exceptions.

## Session Start Sequence

Every new session must execute these steps in order before any work begins:

1. Read `AGENTS.md` — understand the stack, conventions, and errata
2. Run `/cartographer` — build/update the living codebase map
3. Read `forge/patterns.md` — check active warnings from prior sessions
4. Announce: "Session initialized. [N] active forge warnings. Ready for Blueprint."

Do not skip this sequence. Do not start coding before completing it.

## Non-Negotiable Rules

### 1. Blueprint Required
No changes without an approved Blueprint. Spec must include: branch name, commit message, files affected, errata to apply, what gets built. Get Ben's approval before writing code. No exceptions for "small" or "chore" tasks.

### 2. Crucible Skill Checklist (every Blueprint)
| Phase | Skill | Action |
|-------|-------|--------|
| Before code | `/cartographer` | Consult codebase map |
| Before code | `/forge` feed-forward | Read `forge/patterns.md` for warnings |
| During code | `/test-driven-development` | Write tests before implementation (skip only for doc-only changes) |
| Before commit | `/quality-gate` | Red-team changes. Do not commit until gate passes or stagnation detected |
| After PR | `/forge` retrospective | Record lessons immediately. Do not end session without it |
| After PR | Errata + patterns | Update `docs/blueprint-errata.md` and `forge/patterns.md` in the repo. Commit to the PR branch |

If skipping any step, state which and why. Silence is not consent to skip.

### 3. Build Log + Errata
Every PR gets an entry in `docs/build-log.md`. Every Blueprint that produces a lesson gets an entry in `docs/blueprint-errata.md` and `forge/patterns.md`. These files live in the repo (not just agent memory) so future sessions and agents can read them. No PR without a build log entry.

### 4. Visual Verification
All font, icon, image, and asset changes must be visually verified before committing. Render → inspect → confirm → then commit. Never assume rendering is correct.

### 5. Code Quality Gates
- TypeScript strict mode. Zero `any`. Fix all TS errors before task completion.
- ESLint must pass clean before task completion.
- No hardcoded design values — import from `lib/design-tokens.ts`.
- No hardcoded column names — reference `lib/schema.ts`.

### 6. Security & Secrets
- Never commit `.env`, `.env.local`, or any file containing secrets.
- Never log secrets, API keys, or connection strings.
- Never hardcode credentials in source files.
- R2 buckets are private. Never store public URLs — store object keys only.

### 7. Git Discipline
- Always sync with remote main before creating a branch: `git checkout main && git pull origin main`
- Never commit directly to main.
- One Blueprint per branch. Branch naming: `type/short-descriptor`
- All branches merge to main via PR reviewed by Ben.
- Clean up local branches after merge.

### 8. Error Handling
- When unsure about a spec detail, use the most conservative interpretation.
- Leave `TODO: VERIFY` comments for ambiguous decisions so Ben can review.
- If a build fails, diagnose the root cause. Do not retry blindly.
- If a skill fails to invoke, report it — do not silently skip.

## Architecture Quick Reference
- **Stack:** Next.js 16 App Router, React, TypeScript, Tailwind v4, shadcn/ui, Better Auth, Neon PostgreSQL, Vercel, Cloudflare R2
- **Proxy:** `src/proxy.ts` (NOT middleware.ts)
- **Auth routes:** Add to `PROTECTED_PREFIXES` and `config.matcher` in `proxy.ts`
- **Org ID:** Always resolve via `getDetailForgeOrgId()` — never use `activeOrganizationId` directly
- **AI prompts:** Stored in DB `prompts` table, never hardcoded
- **Fonts:** DM Sans (UI), JetBrains Mono (numbers/badges), Lazer84 (wordmark only)
- **Domain:** `detailforge.io` (apex, no www)

## V1.1 Reference Docs
Before starting any v1.1 Blueprint, read the relevant decision doc:
- `docs/v1.1-methodology-engine.md` — Detailer Methodology Engine + Blueprint sequence
- `docs/v1.1-baseline-architecture.md` — Baseline-first estimate architecture
- `docs/v1.1-supply-cabinet.md` — Supply cabinet, job recommendations, reorder reminders
