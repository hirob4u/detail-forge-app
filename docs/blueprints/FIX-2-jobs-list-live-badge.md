# FIX-2: Jobs List Live Badge

## Problem

On the `/jobs` list page, when a new job is submitted and AI analysis is running, the `StageBadge` shows "ANALYZING..." but never updates when analysis completes. The badge stays stuck until the user navigates away and back. This is because the jobs list is a pure server component with no client-side polling.

## Branch

`fix/jobs-list-live-badge`

## Commit Message

`fix: live-polling badge on jobs list for analyzing jobs`

## Approach

Create a `LiveStageBadge` client component that wraps the existing badge rendering logic. It only activates polling when `analysisStatus === "processing"`. When analysis completes (or fails), it calls `router.refresh()` to re-render the full jobs list with fresh server data (updated badge, quote amount, etc.).

For jobs NOT in processing state, the existing static `StageBadge` renders as before — zero overhead.

## Files Affected

| File | Action | Description |
|------|--------|-------------|
| `src/app/(app)/_components/live-stage-badge.tsx` | **New** | Client component: polls `/api/jobs/{id}/status` every 4s when processing, calls `router.refresh()` on terminal state |
| `src/app/(app)/_components/job-card.tsx` | **Modify** | Conditionally render `LiveStageBadge` for processing jobs, `StageBadge` for all others |
| `docs/build-log.md` | **Update** | Build log entry |
| `docs/blueprint-errata.md` | **Update** | No new errata (or record if found) |
| `forge/patterns.md` | **Update** | No new patterns (or record if found) |

## Errata to Apply

- **client poll → router.refresh** pattern from FIX-1 errata: use `useRef` guard to prevent duplicate refreshes
- **git index.lock race**: use `rm -f .git/index.lock; sleep 1; git commit` pattern

## What Gets Built

1. `LiveStageBadge` — mirrors `StageBadge` rendering via shared `getStageBadge()` logic, adds polling + router.refresh
2. `job-card.tsx` conditional: `analysisStatus === "processing"` → `LiveStageBadge`, else → `StageBadge`
3. Poll interval: 4s (slightly slower than job detail's 3s — less critical, lower load)

## What Does NOT Change

- `StageBadge` (server component) — untouched
- `stage-config.ts` — untouched
- Jobs list page (`/jobs/page.tsx`) — untouched (stays server component)
- Status API route — already exists, no changes needed

## Risks

- Multiple processing jobs on the list = multiple concurrent polls. Acceptable for typical load (1-3 concurrent jobs). If this becomes a problem, a future blueprint could consolidate into a single "batch status" API.
