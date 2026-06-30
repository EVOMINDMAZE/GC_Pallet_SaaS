# Public Share-Link — Implementation Plan

## Goal
Authenticated owners can mint a read-only public link to a project that
exposes a curated surface (project meta, progress, inventory) to anyone
with the URL — no account required. Links can expire or be revoked.

## Surface
**Shared view** (read-only, public, no auth):
- Project: name, status, address, budget, dates, progress
- Inventory: items in this project (name, qty, cost, location, total value)
- Documents: list only (no inline file — keeps storage access auth-gated)

**NOT shared**: documents files, full user account, other users' data,
activity log, any other projects.

## Data model
New PB collection `shares`:
| field         | type                       | notes                                   |
|---------------|----------------------------|-----------------------------------------|
| `token`       | text, unique, indexed      | 24-char URL-safe random; the secret     |
| `resource`    | relation → projects        | single relation (only projects)         |
| `created_by`  | relation → users           | owner                                   |
| `expires_at`  | date, nullable             | empty = never expires                   |
| `revoked`     | bool, default false        | soft-revoke so existing links 404       |
| `view_count`  | number, default 0          | server increments on each /share hit    |
| `created`     | autodate                   |                                         |
| `updated`     | autodate                   |                                         |

Rules:
- `listRule`  : `@request.auth.id != ''`
- `viewRule`  : `id != ''`                (public can resolve token)
- `createRule`: `@request.auth.id != ''`
- `updateRule`: `@request.auth.id = created_by.id`
- `deleteRule`: `@request.auth.id = created_by.id`

The `token` is a 24-char base64url random string, separate from the PB
record ID, so we can rotate it without rewriting the record.

## API routes (Next.js, server-side PB)
- `POST /api/shares` (auth required) — create a share
  - body: `{ resourceId, expiresInDays: 1|7|30|null }`
  - returns: `{ token, url, expiresAt }`
- `DELETE /api/shares/[id]` (auth required, owner) — revoke
- `GET /api/shares/[token]` (public) — resolve
  - 404 if unknown / revoked
  - 410 if expired or view limit hit
  - 200 returns `{ project, inventory, expiresAt, viewCount, maxViews? }`

All `GET /api/shares/[token]` requests go through a server-side admin PB
client so we never expose a user's auth token to the public surface.

## UI
- New "Share" button on the project detail page header (next to Edit)
- Share dialog with:
  - Expiry pill group: 24h / 7d / 30d / Never
  - "Generate link" button → shows URL with copy button
  - List of existing active shares for this project with: URL, expires,
    "Revoke" button
- Public route `/share/[token]` with marketing-style minimal layout
  - Renders project hero, status, progress bar, budget, inventory table
  - Footer note: "Shared by {ownerName} • Expires in N days" (or
    "Expired" / "Revoked" / "View limit reached" terminal states)
  - Theme toggle works

## Files
New:
- `pb_migrations/1782XXXXXX_created_shares.js`
- `lib/pb-admin.ts` — singleton admin PB client (uses `POCKETBASE_ADMIN_TOKEN`)
- `app/api/shares/route.ts` (POST create)
- `app/api/shares/[id]/route.ts` (DELETE revoke)
- `app/api/shares/[token]/route.ts` (GET public resolve)
- `components/projects/share-dialog.tsx`
- `components/projects/shares-list.tsx`
- `app/share/[token]/page.tsx` (public)
- `app/share/[token]/loading.tsx`
- `app/share/layout.tsx` (minimal, no auth gate)
- `hooks/useShares.ts`
- `lib/share-token.ts` (URL-safe random)

Modified:
- `app/(dashboard)/projects/[id]/page.tsx` — add Share button
- `lib/pb-admin.ts` (new) or extend `lib/pocketbase.ts`
- `next.config.mjs` — no changes

## Backend env
Add `POCKETBASE_ADMIN_TOKEN` to backend env + Next.js public env. The
admin token is a one-time bootstrap created in the PB Admin UI under
Settings → API tokens.

## E2E
New Stage 6:
- Create a share, copy URL, log out, open the public URL in a new
  context, assert project + inventory render
- Revoke the share, reopen → "revoked" terminal
- Generate a 1-day share, set server time forward, reopen → "expired"

## Out of scope
- Document file streaming (could land in a follow-up)
- Password protection (could land in a follow-up)
- View limit (could land in a follow-up)
- QR codes for share links (follow-up)

## Estimated effort
- Schema + admin client: 30 min
- API routes: 45 min
- Dialog + list UI: 60 min
- Public /share page: 45 min
- E2E + docs: 30 min
- Total: ~3.5 h
