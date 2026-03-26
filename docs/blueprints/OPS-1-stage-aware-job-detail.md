# Blueprint OPS-1: Stage-Aware Job Detail Layout

**Branch:** `feat/stage-aware-job-detail`
**Commit message:** `feat: stage-aware job detail layout with primary action zones`
**Depends on:** Nothing
**Errata to apply:** Mobile-first visual verification (2026-03-21), Collapsible content inert (2026-03-21)

---

## What Gets Built

The job detail page (`src/app/(app)/dashboard/jobs/[jobId]/page.tsx`) is refactored from a static vertical card stack into a stage-aware layout with three zones:

1. **Header zone** (always visible): Vehicle title, stage badge, stage pipeline
2. **Primary action zone** (stage-specific): The one thing the detailer needs to do, with a prominent CTA
3. **Context zone** (stage-specific): Supporting information for the current action
4. **Details zone** (collapsible): Everything else, accessible but not competing for attention

No new components are created. No new APIs. No schema changes. All existing components are reused — they are rearranged and given different prominence based on `job.stage`.

---

## Files Affected

| File | Change |
|------|--------|
| `src/app/(app)/dashboard/jobs/[jobId]/page.tsx` | Refactor layout into stage-aware zone composition |
| `src/app/(app)/dashboard/jobs/[jobId]/_components/stage-layout.tsx` | **New.** Client component that receives stage + children slots and renders the appropriate zone composition |
| `src/app/(app)/dashboard/jobs/[jobId]/_components/primary-action-banner.tsx` | **New.** Reusable banner component for the primary action zone: heading, subtext, CTA button, optional status indicator |

---

## Stage Compositions

### `created` — "Review the AI assessment and build your quote"

**Primary action zone:**
- If `analysisStatus === 'processing'`: AnalysisStatusPanel (promoted to primary zone, not buried below photos)
- If `analysisStatus === 'complete'`: AIConditionNotesCard (FULL flags, not 3-flag teaser) + "Review & Build Quote" CTA → links to `/dashboard/jobs/[jobId]/review`
- If `analysisStatus === 'failed'`: AnalysisStatusPanel with retry

**Context zone:**
- Two-column: PhotoViewer (left/top on mobile) + CustomerCard with intents (right/bottom on mobile)
- CustomerNotesCard (if notes exist)

**Details zone (collapsed):**
- PackagePricingCard (shows AI estimate if available)
- JobNotes
- StageHistory
- StageControls

### `quoted` — "Send this quote to the customer"

**Primary action zone:**
- PrimaryActionBanner: "Quote ready — $[total]" + "Send to Customer" CTA
- PackagePricingCard (summary view showing line items and total)

**Context zone:**
- CustomerCard (email prominent — they need it to send)
- JobNotes

**Details zone (collapsed):**
- AIConditionNotesCard
- PhotoViewer
- StageHistory
- StageControls (secondary transitions)

### `sent` — "Waiting on customer response"

**Primary action zone:**
- PrimaryActionBanner: "Quote sent [X days ago]" + aging indicator color
  - Fresh (< 24h): muted, no CTA
  - Aging (24-72h): amber, "Send Follow-Up" CTA
  - Stale (> 72h): red, "Send Follow-Up" CTA
- Compute days from `quoteSentAt` or last `stageHistory` entry where `to === 'sent'`

**Context zone:**
- PackagePricingCard (read-only summary)
- CustomerCard (contact info for manual follow-up)

**Details zone (collapsed):**
- PhotoViewer
- AIConditionNotesCard
- JobNotes
- StageHistory
- StageControls

### `approved` — "Customer approved — start when ready"

**Primary action zone:**
- PrimaryActionBanner: "Approved — $[total]" + "Start Work" CTA (stage transition to inProgress)

**Context zone:**
- PackagePricingCard (approved line items as work reference)
- CustomerCard
- PhotoViewer (reference during work)
- JobNotes (editable)

**Details zone (collapsed):**
- AIConditionNotesCard
- StageHistory
- StageControls (secondary)

### `inProgress` — "Work underway"

**Primary action zone:**
- PrimaryActionBanner: "In Progress" + "Move to QC" CTA (stage transition)
- JobNotes (editable, prominent — this is where they jot notes during work)

**Context zone:**
- PackagePricingCard (work checklist reference)
- PhotoViewer (reference)

**Details zone (collapsed):**
- CustomerCard
- AIConditionNotesCard
- StageHistory
- StageControls (secondary)

### `qc` — "Upload after photos and complete checklist"

**Primary action zone:**
- PrimaryActionBanner: "Quality Check" + "Open QC Checklist" CTA → links to `/dashboard/jobs/[jobId]/qc`
- (The existing QC link card is promoted here)

**Context zone:**
- PhotoViewer (before photos for reference during QC)
- PackagePricingCard (what was scoped)

**Details zone (collapsed):**
- CustomerCard
- JobNotes
- AIConditionNotesCard
- StageHistory
- StageControls

### `complete` — "Job complete — share your work"

**Primary action zone:**
- SocialExportPanel (promoted to primary zone)

**Context zone:**
- PhotoViewer (before/after showcase)
- PackagePricingCard (final summary)

**Details zone (collapsed):**
- CustomerCard
- JobNotes
- StageHistory
- StageControls (archive option)

### `archived` — "Archived job"

**Primary action zone:**
- PrimaryActionBanner: "Archived" + "Reopen" CTA (stage transition back)

**Context zone:**
- PackagePricingCard
- StageHistory (open by default for archived jobs)

**Details zone (collapsed):**
- Everything else

---

## Implementation Approach

### 1. StageLayout client component

```tsx
// Receives stage and named slot children
// Renders them in the correct zone order per stage
<StageLayout stage={job.stage}>
  <StageLayout.Primary>...</StageLayout.Primary>
  <StageLayout.Context>...</StageLayout.Context>
  <StageLayout.Details>...</StageLayout.Details>
</StageLayout>
```

Alternatively (simpler): a server-side helper function that returns the ordered component array per stage, and the page.tsx renders them in that order. No client component needed for just reordering.

**Decision: Use server-side conditional rendering in page.tsx.** The stage is known at render time (server component). No client interactivity needed for layout selection. Wrap the Details zone children in `<CollapsibleSection>` components (already exist and support `inert`).

### 2. PrimaryActionBanner component

A simple presentational component:
```tsx
interface PrimaryActionBannerProps {
  heading: string;
  subtext?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void; // for stage transitions that need client action
  variant?: 'default' | 'warning' | 'success' | 'muted';
}
```

Server component (no state). Uses design tokens. JetBrains Mono for the heading metric (e.g., "$1,250"). DM Sans for descriptive text.

### 3. AIConditionNotesCard enhancement

Currently shows max 3 flags. For the `created` stage primary zone, render ALL flags (not just 3). Pass a `compact={false}` prop to show full detail.

No new component — add an optional `expanded` prop to the existing AIConditionNotesCard:
- `expanded={false}` (default): Current 3-flag teaser behavior
- `expanded={true}`: All flags with descriptions, used in primary zone

### 4. Aging computation

```tsx
function getDaysInStage(stageHistory: StageHistoryEntry[]): number {
  if (!stageHistory.length) return 0;
  const lastEntry = stageHistory[stageHistory.length - 1];
  return Math.floor((Date.now() - new Date(lastEntry.at).getTime()) / 86400000);
}

function getAgingVariant(days: number): 'fresh' | 'aging' | 'stale' {
  if (days < 1) return 'fresh';
  if (days <= 3) return 'aging';
  return 'stale';
}
```

Server-side computation passed as props. No polling needed.

---

## Testing Strategy

### Visual verification (mandatory):
- Screenshot each stage layout at desktop (1280px) and mobile (375px)
- Verify primary action zone is above the fold on mobile for every stage
- Verify collapsed sections use `inert` attribute (forge pattern 2026-03-21)

### Manual test matrix:

| Stage | Verify |
|-------|--------|
| created + processing | AnalysisStatusPanel is in primary zone, not buried |
| created + complete | Full AI flags visible, "Review & Build Quote" CTA works |
| created + failed | Retry button is in primary zone |
| quoted | Quote total visible, "Send to Customer" CTA works |
| sent (< 24h) | Muted banner, no follow-up CTA |
| sent (> 48h) | Amber banner, "Send Follow-Up" CTA visible |
| sent (> 72h) | Red banner, "Send Follow-Up" CTA visible |
| approved | "Start Work" CTA triggers stage transition |
| inProgress | "Move to QC" CTA works, notes are editable |
| qc | "Open QC" CTA links correctly |
| complete | Social export is in primary zone |
| archived | "Reopen" CTA works |

### Regression:
- All existing stage transitions still work (StageControls in details zone)
- Photo lightbox still functions
- Auto-save on JobNotes still functions
- Review page link still works
- QC page still accessible

---

## What This Does NOT Change

- No new API routes
- No schema migrations
- No changes to the review page or QC page
- No changes to the job list page (that's OPS-2/OPS-3)
- No changes to stage transition logic
- No new data fetching — all data already loaded in page.tsx

---

## Acceptance Criteria

1. Each of the 8 stages renders a distinct primary action zone with a clear CTA
2. The primary action and CTA are above the fold on mobile (375px) for every stage
3. Secondary information is accessible via CollapsibleSection, not removed
4. All existing functionality (stage transitions, photo viewer, notes, review link) still works
5. AI condition flags show full detail (not 3-flag teaser) when in `created` stage primary zone
6. Sent-stage aging indicator shows correct color based on time since quote was sent
7. ESLint passes clean. TypeScript strict, zero `any`.
