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
