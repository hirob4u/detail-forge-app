# DetailForge -- Blueprint Errata

**Started:** February 2026  
**Builder:** Ben Foran -- Foranware -- detailforge.io  
**Companion to:** Agent-Driven Build Plan v1.0

---

## What This File Is

Every correction round produces a lesson. This file captures those lessons as specific, actionable improvements to the Blueprint templates in the Agent-Driven Build Plan.

The Build Log records what happened. This file records what to do differently next time. Add an entry whenever a correction Blueprint is required. The **Add to Blueprint** field is the most important one -- it is the specific text that should be added to the relevant Blueprint template to prevent the same correction from being needed again.

---

## How This Feeds Back Into the Build Plan

When this file identifies an improvement to a Blueprint template, apply it the next time you run a similar task. If you use this workflow on another project, start by applying all errata improvements to the Blueprint templates before you begin. That is the compounding value of documenting this process.

---

## Entries

---

### Blueprint C -- UI Component / Foundation
### Issue: Lazer 84 Self-Hosted Font

**Issue:** Blueprint skipped Lazer 84 with instruction to add it later. Agent correctly followed this but left no clear path forward, requiring a separate correction Blueprint.

**Root cause:** Blueprint did not specify that Lazer 84 is not available on Google Fonts and must be self-hosted. No `@font-face` declaration or `public/fonts/` directory instruction was provided.

**Fix applied:** Correction Blueprint added `@font-face` declaration in `globals.css` and placed the downloaded `Lazer84.ttf` file in `public/fonts/`. CSS variable `--font-lazer84` now resolves correctly.

**Add to Blueprint:** When Lazer 84 is required, specify that it is not on Google Fonts, must be downloaded from `lazervisuals.com/lazer-84.html`, placed at `public/fonts/Lazer84.ttf`, and loaded via `@font-face` in `globals.css` with `font-display: swap`. Always include this in any Blueprint that sets up the font system.

---

### Blueprint B -- API Route / Server Action (Auth Setup)
### Issue: Next.js 16 -- middleware.ts Deprecated

**Issue:** Agent created `src/middleware.ts` following the standard Next.js convention. Next.js 16 renamed this file to `proxy.ts`. The dev server showed a deprecation warning and route protection did not behave as expected.

**Root cause:** Next.js 16 was released after much of the model's training data was collected. The `middleware.ts` to `proxy.ts` rename is a recent breaking change the agent does not know as default behavior.

**Fix applied:** Correction Blueprint renamed `src/middleware.ts` to `src/proxy.ts`. Logic was unchanged.

**Add to Blueprint:** Add to all Blueprints that involve middleware or route protection: "This project uses Next.js 16. The middleware file is `src/proxy.ts`, not `src/middleware.ts`. Do not create `middleware.ts`."

---

### Blueprint B -- API Route / Server Action (Auth Setup)
### Issue: Better Auth Drizzle Adapter -- Schema Object Required

**Issue:** Better Auth threw `BetterAuthError` on sign-up: "The model user was not found in the schema object. Please pass the schema directly to the adapter options." Sign-up returned a 500 error.

**Root cause:** Blueprint did not specify that Better Auth requires its own database tables (user, session, account, verification) to be added to the Drizzle schema, and that the full schema object must be passed directly to the Drizzle adapter -- not just the database client.

**Fix applied:** Correction Blueprint added Better Auth's required tables to `src/lib/db/schema.ts`, ran `drizzle-kit generate` and `drizzle-kit migrate` to create them in Neon, and updated `src/lib/auth.ts` to pass the full schema object to the adapter using `drizzleAdapter(db, { provider: 'pg', schema })`.

**Add to Blueprint:** Add to Blueprint B when setting up Better Auth: "Better Auth requires its own tables in the Drizzle schema: user, session, account, and verification. Add these to `src/lib/db/schema.ts` before configuring the adapter. Pass the full schema object to the Drizzle adapter: `drizzleAdapter(db, { provider: 'pg', schema })` where schema is imported as `import * as schema from './db/schema'`. Run `drizzle-kit generate` and `drizzle-kit migrate` after updating the schema."

---

<!-- ADD NEW ENTRIES ABOVE THIS LINE -->
