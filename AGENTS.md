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

## Git Workflow
- Never commit directly to main
- Branch naming: type/short-descriptor
  - feat/ for new screens and components
  - api/ for server actions and API routes
  - schema/ for data layer changes
  - fix/ for correction tasks
  - chore/ for config and tooling
- One Blueprint task per branch
- All branches merge to main via PR