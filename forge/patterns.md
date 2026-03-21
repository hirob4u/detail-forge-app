# Forge Patterns — Active Warnings

This file is maintained by `/forge` retrospectives. Each entry is a forward-looking warning derived from a past session.

---

## [2026-03-20] Phone utility + UI polish (fix/ux-navigation-polish)

**Warning: Phone utility functions must handle nullable inputs and strip country codes before formatting.**

Root cause: `stripPhone` only accepted `string`, not `string | null | undefined`. Country code "1" was not stripped before passing to `formatPhone`, causing display corruption and `tel:` href bugs. Both issues were caught late (quality gate round 2–4), requiring multiple rework cycles.

Action required: When writing any string-transform utility, define the input type as `string | null | undefined` from the start and handle all falsy paths explicitly.

---

## [2026-03-20] Semantic HTML on interactive landmark elements

**Warning: Never apply `role="button"` (or any widget role) directly to a landmark element (`<header>`, `<nav>`, `<main>`, etc.).**

Root cause: The first implementation made the entire `<header>` tappable by adding `role="button"`, which overrides the landmark semantics and fails ARIA rules. The fix — wrapping a `<button>` inside `<header>` — was obvious in retrospect but required a quality gate round to catch.

Action required: When making a region tappable, always introduce a child `<button>` or `<a>` rather than promoting the landmark itself.

---

## [2026-03-20] Form init vs. display vs. edit phone state must use consistent transform

**Warning: Confirm the full phone data lifecycle (DB read → display → edit init → save) uses the same strip/format/mask pipeline before writing any phone-related form code.**

Root cause: `branding-form.tsx` used `formatPhone` to initialize the edit field but `maskPhone` during editing, creating a country-code round-trip mismatch on save. Fixing this required a third quality gate round.

Action required: Sketch the phone data lifecycle (raw → display mask → form init → user edit → strip → save) before touching any form that handles phone numbers.

---

## [2026-03-20] Stage badge color coherence (fix/stage-badge-colors)

**Warning: Verify all referenced CSS custom property names exist in globals.css before using them in Tailwind arbitrary value syntax.**

Root cause: Stage badges had two separate color maps (stage-config.ts for dashboard cards, stage-badge.tsx for job card pills) with duplicated and inconsistent values — 3 color pairs shared across 7 stages, hardcoded Tailwind palette colors mixed with design token references. Quality gate false-positived on CSS variable names because the reviewer assumed camelCase token exports (`purpleText`) matched the CSS variable names, when they're actually kebab-case (`--color-purple-text`).

Action required: When writing `text-[var(--color-*)]` or `bg-[var(--color-*)]` patterns, grep globals.css for the exact variable name first. Establish a single canonical config file before refactoring consumers — don't update two files in parallel.

---

## [2026-03-21] Server-side enforcement of UI constraints (feat/job-stage-ux)

**Warning: Any constraint enforced in the UI (requireNote, field validation, transition rules) must also be enforced in the API handler.**

Root cause: The "Reopen Job" transition required a note for the audit trail, but this was only checked client-side. The API accepted the transition without a note, meaning any direct API caller could bypass the audit trail. Quality gate caught this as Fatal in round 1.

Action required: When adding a new UI constraint to a form or action (required fields, conditional validation, mandatory notes), immediately add the same check to the API handler. Search for the API route and add the validation before writing the client-side code.

---

## [2026-03-21] router.refresh() is fire-and-forget (feat/job-stage-ux)

**Warning: After calling `router.refresh()` in Next.js App Router, buttons re-enable immediately because the refresh is not awaitable. Users can click again before server data arrives.**

Root cause: `setPendingTo(null)` in the `finally` block ran after the fetch resolved, but `router.refresh()` was already called without await. Buttons re-enabled while stale data was still displayed. A quick double-click during this window would submit a second PATCH against the old stage.

Action required: After `router.refresh()`, set an `isRefreshing` state that keeps buttons disabled. Clear it in a `useEffect` keyed on the server-delivered prop that changes after refresh (e.g., `currentStage`).

---

## [2026-03-21] Magenta reservation enforcement (feat/job-stage-ux)

**Warning: Magenta (#E040FB / `--color-magenta`) is reserved for AI-generated content indicators only. Do not use it for stage badges, status indicators, or any non-AI UI element.**

Root cause: The stage badge color Blueprint assigned magenta to `inProgress` for visual warmth in the gradient, violating the AGENTS.md rule. Quality gate caught this as Significant in round 2.

Action required: Before using `--color-magenta` in any new component, verify it relates to AI-generated content. If not, use `--color-purple-action` or `--color-purple-text` for "active/interactive" semantics.

---
