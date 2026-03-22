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

## [2026-03-21] Mobile-first visual verification (feat/job-stage-ux)

**Warning: Every UI component must be visually verified at mobile width (375px) before committing. TypeScript and ESLint do not catch layout overflow.**

Root cause: Pipeline progress indicator used `flex-1` with `whitespace-nowrap` labels on 7 items — worked fine on desktop but labels overflowed and truncated on mobile. Shipped without visual verification at mobile viewport. Quality gate reviews code, not rendered pixels.

Action required: After implementing any visual component, use `preview_resize` with mobile preset (375x812) and take a screenshot before committing. This is especially critical for flex layouts with many items, horizontal arrangements, and text labels.

---

## [2026-03-21] Collapsible content must be inert when collapsed (feat/progressive-disclosure-ux)

**Warning: CSS-only collapse (grid-rows-[0fr] + overflow-hidden) hides content visually but leaves it in the tab order. Keyboard users can tab into invisible buttons/links.**

Root cause: CollapsibleSection used `aria-hidden` on the collapsed panel but did not set the `inert` attribute. Screen readers and keyboard navigation could still reach focusable children inside the collapsed region.

Action required: Always add `inert={!open}` alongside `aria-hidden={!open}` on collapsible content panels. This prevents keyboard focus from entering hidden content.

---

## [2026-03-21] Track lastSaved state, not initialProps, for dirty detection (feat/progressive-disclosure-ux)

**Warning: Comparing editable field state against a server-provided initial prop breaks dirty detection after the first save.**

Root cause: JobNotes compared `notes !== initialNotes` to determine dirty state. After a successful save, `initialNotes` still held the original server render value, so the Save button stayed enabled even though nothing changed. The user could save indefinitely.

Action required: When building save-in-place UI, track a `lastSaved` state value updated on successful save. Derive `isDirty` from `notes !== lastSaved`, not from the initial prop.

---

## [2026-03-21] Use stable keys for removable list items (feat/progressive-disclosure-ux)

**Warning: Using array index as React key for lists that support item removal causes state to migrate to the wrong component.**

Root cause: ServiceLineItem used `key={index}`. When item at index 0 was removed, the component at index 1 inherited index 0's internal state (like `noteOpen`). This is a known React anti-pattern but easy to miss.

Action required: Use a counter ref (`useRef(0)`) to generate monotonically increasing keys assigned at item creation time. Strip the `_key` field before serializing to the API.

---

## [2026-03-22] `--color-brand` is page-scoped, not global (fix/waitlist-confirmation-polish)

**Warning: `--color-brand` and `--color-brand-hover` CSS variables are set via inline style on the intake page root element — they are NOT globally defined in CSS.**

Root cause: Confirmation page used `bg-[var(--color-brand)]` but the variable was undefined because it's only set on the intake page's wrapper div. The button rendered with a transparent background.

Action required: Any page that uses brand color outside the intake layout must fetch `accentColor` from DB and set `--color-brand` (and `--color-brand-hover` via `color-mix()`) as inline style on that page's root element, matching the established pattern in `estimate/[intakeSlug]/page.tsx`.

---

## [2026-03-22] Agent must not write code before Blueprint approval (fix/waitlist-confirmation-polish)

**Warning: No code changes without an approved Blueprint. The agent must self-enforce this gate before any Edit/Write tool use.**

Root cause: Agent implemented both changes before presenting a Blueprint for approval. User had to stop the agent and require a revert. This wasted time and violated the project's non-negotiable rules.

Action required: Before using Edit, Write, or creating any file, verify that a Blueprint has been presented and explicitly approved by the user in the current session.

---
