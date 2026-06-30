# GC Pallet — Public Marketing Site

## Summary

Today the entire app is auth-gated. An unauthenticated visitor at `/` lands on `/login` and there is no public surface to learn about GC Pallet. This plan adds a full public marketing layer in front of the existing app:

- **`/`** — public homepage when signed out; dashboard when signed in (preserves current behavior)
- **`/pricing`** — three pricing tiers (Starter, Crew, Pro) with monthly/yearly toggle
- **`/features`** — one card per major capability (Projects, Documents, Inventory, Workflows)
- **`/about`** — brand story, team values, the "Operations Hub" pitch
- **`/contact`** — contact form (saves to a new PocketBase `contact_messages` collection)
- **`/legal/privacy`** and **`/legal/terms`** — placeholder pages with the brand chrome

A new `(marketing)` route group with its own public layout (top nav + footer) sits next to the existing `(auth)` and `(dashboard)` groups. The current `DashboardGate` is untouched — we only change the route that `/` resolves to when no auth is present.

## Current State Analysis (grounded)

- **Auth gate today.** `frontend/app/(dashboard)/layout.tsx` wraps every dashboard page in `DashboardGate`, which redirects unauth users to `/login`. `frontend/components/layout/dashboard-gate.tsx` short-circuits SSR by rendering "Redirecting to login…" until `pb.authStore.model` hydrates.
- **No public pages.** `frontend/app/` only contains `(auth)/login`, `(auth)/register`, and `(dashboard)/...`. There is no public route group, no public layout, no marketing nav, no footer.
- **`/` is dashboard.** [frontend/app/(dashboard)/page.tsx](file:///workspace/frontend/app/(dashboard)/page.tsx) renders the StatsCards / Project Status Chart / Recent Activity dashboard. Auth-gated.
- **Tokens already support the work.** [tailwind.config.ts](file:///workspace/frontend/tailwind.config.ts) and [globals.css](file:///workspace/frontend/app/globals.css) already expose the brand palette + dark/light theming. All marketing pages use the same `bg-background`, `text-foreground`, `bg-gcpallet-*`, `text-body`, `text-h1`, etc.
- **Topbar / sidebar are dashboard-only.** [topbar.tsx](file:///workspace/frontend/components/layout/topbar.tsx) and [sidebar.tsx](file:///workspace/frontend/components/layout/sidebar.tsx) are wired under `(dashboard)/layout.tsx`. The marketing site uses a separate `PublicNav` + `PublicFooter`.
- **No contact-message backend.** PocketBase has `users`, `projects`, `documents`, `inventory`, and `categories` collections but no inbox. We add a new `contact_messages` collection with three fields (name, email, message) and a server-side rule that any unauth visitor can `create`.
- **Existing screenshot & test infrastructure** (`backend/scripts/{e2e,frontend-routes,ui-e2e}.mjs/.py`) and `/tmp/gcpallet-*/` folders will be extended.

## Proposed Changes

### 1. New `(marketing)` route group + public layout

**Files**
- **Create** [frontend/app/(marketing)/layout.tsx](file:///workspace/frontend/app/(marketing)/layout.tsx): renders `PublicNav` + `{children}` + `PublicFooter` inside a `<div className="min-h-screen bg-background text-foreground">`. Includes `<Toaster />`. **No `DashboardGate`**.
- **Create** [frontend/components/marketing/public-nav.tsx](file:///frontend/components/marketing/public-nav.tsx): sticky top nav with the `GC PALLET / Operations Hub` wordmark (re-using `SidebarHeader`'s mark), nav links (Features, Pricing, About, Contact), and a right-side cluster: theme toggle + "Sign in" outline button + "Start free" primary button (links to `/register`). On scroll past 32px, nav gets `bg-background/85 backdrop-blur`.
- **Create** [frontend/components/marketing/public-footer.tsx](file:///frontend/components/marketing/public-footer.tsx): four columns — Product (Features, Pricing, Changelog stub), Company (About, Contact, Careers stub), Legal (Privacy, Terms), Social (GitHub/LinkedIn stubs). Bottom row: copyright + theme toggle + locale stub.
- **Create** [frontend/app/page.tsx](file:///frontend/app/page.tsx) **OR** move `frontend/app/(dashboard)/page.tsx` to `frontend/app/(dashboard)/(app)/page.tsx` and let the marketing group's `app/(marketing)/page.tsx` own `/`. The cleaner approach is the second — split the `(dashboard)` group into `(dashboard)/(app)` so the authed `/` resolves correctly. Auth gate still wraps everything.
- **Edit** [frontend/components/layout/dashboard-gate.tsx](file:///frontend/components/layout/dashboard-gate.tsx): the redirect target `/login` is unchanged. The gate stays scoped to `(dashboard)/layout.tsx`; marketing pages are not children of it.

**Why this structure**: route groups in Next.js App Router let us isolate the marketing chrome (`(marketing)/layout.tsx`) from the dashboard chrome (`(dashboard)/layout.tsx`) without affecting the URL. The same `/` URL works for both audiences because we keep the existing `(dashboard)/page.tsx` and let `(marketing)/page.tsx` own its own copy of `/`.

**Conflict resolution**: in Next.js, two route groups both defining `/` is supported — they are independent routes with distinct layouts. We rely on this.

### 2. Marketing pages

**Files**
- **Create** [frontend/app/(marketing)/page.tsx](file:///frontend/app/(marketing)/page.tsx) — homepage:
  - `<Hero>`: H1 "Run every job site from one operations hub", sub-headline, primary CTA "Start free" + secondary "Sign in", product mockup SVG/illustration (use existing brand colors only — no external image)
  - `<SocialProof>`: 5 logo placeholders ("GC Pallet customer logos — placeholder")
  - `<FeatureHighlights>`: 3 large feature cards (Projects, Documents, Inventory) with icon + 2-line description
  - `<HowItWorks>`: 3 numbered steps ("Create project → Upload documents → Track inventory")
  - `<TestimonialBlock>`: 2 fictitious but plausible quotes with name + title
  - `<FAQ>`: 6 questions in a `<details>` accordion (no JS)
  - `<FinalCTA>`: "Ready to ship less paper?" + Start free button
- **Create** [frontend/app/(marketing)/pricing/page.tsx](file:///frontend/app/(marketing)/pricing/page.tsx) — pricing:
  - Monthly / yearly toggle (default monthly), client component
  - 3 tier cards: **Starter** (free), **Crew** ($19/mo per user), **Pro** ($49/mo per user). Each: name, price, 6-bullet feature list, primary CTA button. Highlighted tier ("Most popular") gets an orange border + scale-1.02
  - Comparison table below (Feature × Tier)
  - FAQ block (4 questions)
- **Create** [frontend/app/(marketing)/features/page.tsx](file:///frontend/app/(marketing)/features/page.tsx) — features:
  - Hero "Everything you need to run a job site"
  - One section per feature (Projects, Documents, Inventory, Workflows) with icon, headline, 3 sub-bullets, small SVG mockup
- **Create** [frontend/app/(marketing)/about/page.tsx](file:///frontend/app/(marketing)/about/page.tsx) — about:
  - Hero "Built for the people who actually build things."
  - 3-column values grid (Reliability / Clarity / Speed)
  - Timeline / story placeholder (5 bullets in a vertical line)
  - Final CTA
- **Create** [frontend/app/(marketing)/contact/page.tsx](file:///frontend/app/(marketing)/contact/page.tsx) — contact:
  - Form: name, email, message (textarea), submit. Client component (`useState` + zod). On submit POSTs to `/api/collections/contact_messages/records`. Success → toast + clear form; failure → destructive toast with error.
  - Side panel: support email, response-time expectation, FAQ link
- **Create** [frontend/app/(marketing)/legal/privacy/page.tsx](file:///frontend/app/(marketing)/legal/privacy/page.tsx): centered prose, 1-page placeholder with "Last updated" date
- **Create** [frontend/app/(marketing)/legal/terms/page.tsx](file:///frontend/app/(marketing)/legal/terms/page.tsx): same pattern

**New shared marketing components** (all under `frontend/components/marketing/`):
- `hero.tsx` — eyebrow + h1 + sub + cta cluster
- `feature-card.tsx` — icon + title + 2 lines + optional link
- `pricing-tier.tsx` — used in pricing
- `pricing-toggle.tsx` — monthly/yearly switch
- `comparison-table.tsx` — used in pricing
- `faq.tsx` — `<details>` accordion (server-rendered, no JS)
- `section.tsx` — wrapper that enforces max-w-6xl + py-16 + responsive padding
- `cta-banner.tsx` — reusable banner with primary CTA
- `mockup.tsx` — SVG-only product mockup that renders the brand chrome (sidebar + dashboard cards)

### 3. Backend — contact form

**Files**
- **Create** [backend/pb_migrations/1782800000_created_contact_messages.js](file:///workspace/backend/pb_migrations/1782800000_created_contact_messages.js): new PocketBase collection `contact_messages` with fields `name` (text, required), `email` (email, required), `message` (text, required), `created` (auto), `updated` (auto). Rules: `listRule = ""`, `viewRule = ""`, `createRule = ""`, `updateRule = null`, `deleteRule = null`. So anyone can `POST` to create, no one can read or modify.

**Why a separate migration**: PocketBase's admin-generated migrations are immutable once applied in another environment. We add a fresh migration rather than editing the existing `projects` migration.

### 4. Reusable primitives

**Files**
- **Create** [frontend/components/marketing/theme-toggle.tsx](file:///frontend/components/marketing/theme-toggle.tsx): thin re-export of `components/theme/theme-toggle.tsx` so marketing pages don't need to import from a `theme/` folder. Or just use the existing one — no need to re-export. **Decision**: skip this file; import directly from `components/theme/theme-toggle`.

### 5. Wiring

**Files**
- **Edit** [frontend/app/layout.tsx](file:///workspace/frontend/app/layout.tsx) **NO CHANGE** — it already wraps everything in `<Providers>` (SWR + ThemeProvider + Toaster).
- **Edit** [frontend/app/(marketing)/layout.tsx](file:///frontend/app/(marketing)/layout.tsx): include `<PublicNav />` + `<Toaster />` + `<PublicFooter />`. No `<DashboardGate>`.

## Assumptions & Decisions

- **Marketing site is fully public.** No partial gating, no "Log in to see pricing". Pricing is public; pricing is shown but the user must sign up to actually buy.
- **Two route groups own `/`.** Marketing `app/(marketing)/page.tsx` and dashboard `app/(dashboard)/page.tsx`. Next.js App Router supports this — both routes resolve at build time. We document the duplicate `/` as intentional.
- **No new npm packages.** `<details>` accordion is native HTML. Mockup uses inline SVG. Pricing toggle is a single `useState`.
- **No real i18n.** Locale stub in the footer only.
- **No actual payment.** Pricing CTAs link to `/register` (post-signup the user lands on the dashboard; future work can hook up Stripe).
- **Contact form is a real PocketBase write.** Visitors do not need to be authenticated to POST. The migration's `createRule = ""` allows this.
- **No new user collections** — the dashboard's auth flow is unchanged.
- **Out of scope**: blog, careers, case studies, video hero, multilingual, dark/light marketing images, conversion tracking, A/B tests.

## Verification

A. **Type-check**:
```bash
cd /workspace/frontend && pnpm typecheck   # → 0 errors
```

B. **Production build**:
```bash
cd /workspace/frontend && pnpm build       # → routes table includes /, /pricing, /features, /about, /contact, /legal/privacy, /legal/terms
```

C. **Existing E2E suite stays green**:
```bash
cd /workspace/backend && node scripts/e2e.mjs              # → 24/24 (no API change for projects/users/etc.)
cd /workspace/backend && node scripts/frontend-routes.mjs  # → 8/8 + new marketing routes added
cd /workspace/backend && python3 scripts/ui-e2e.py         # → 40/40 (gated behavior preserved)
```

D. **Extend `frontend-routes.mjs`** with new public routes:
- `/` (200, must contain "Operations Hub" or "Run every job site")
- `/pricing` (200, must contain "Starter" or "Pricing")
- `/features` (200, must contain "Features" or "Projects")
- `/about` (200, must contain "About" or "Built for")
- `/contact` (200, must contain "Contact" or "Send message")
- `/legal/privacy` (200, must contain "Privacy")
- `/legal/terms` (200, must contain "Terms")

E. **Extend `ui-e2e.py` with Stage 4 — public marketing**:
1. While logged out, visit `/`, `/pricing`, `/features`, `/about`, `/contact`. Assert each renders its H1.
2. Click "Sign in" in PublicNav → lands on `/login`.
3. Click "Start free" → lands on `/register`.
4. On `/contact`, fill form, submit → assert a new `contact_messages` record was created (PB API check) and success toast.
5. Toggle theme from PublicNav → assert `<html>` class flips.

F. **Screenshots in `/tmp/gcpallet-marketing/`**:
- `home-light.png`, `home-dark.png`
- `pricing-light.png`, `pricing-dark.png`
- `features-light.png`
- `about-light.png`
- `contact-light.png`
- `mobile-home.png` (375×812)

G. **Manual visual check**:
- Navigate `/ → /pricing → /features → /about → /contact` in both themes — confirm no light/dark bleed.
- PublicNav stays sticky; footer renders below 100% content.
- Auth-gated dashboard is unaffected: a signed-in user still lands on the dashboard at `/`.