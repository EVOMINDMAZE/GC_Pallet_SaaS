# GC Pallet

Inventory & document management for general contractors.

## Stack
- Backend: PocketBase (SQLite, Auth, Files, Realtime) — see `backend/`
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui — see `frontend/`

## Quick start

```bash
# Backend (PocketBase on :8090) — Linux x86_64 binary committed to backend/pocketbase
cd backend && ./pocketbase serve

# Frontend (Next.js on :3000)
cd frontend && pnpm install && pnpm dev
```

Configure `frontend/.env.local` from `.env.local.example`:

```
NEXT_PUBLIC_PB_URL=http://127.0.0.1:8090
```

## Collections
users (extended), projects, documents, inventory — all scoped via `@request.auth.id == user`.

## First-time PocketBase setup

1. `cd backend && ./pocketbase serve --http=127.0.0.1:8090`
2. Visit `http://127.0.0.1:8090/_/` and create the first superuser (password ≥ 10 chars).
3. Stop the server (Ctrl-C).
4. Bootstrap collections and extend `users` with extra fields:
   ```bash
   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpass node backend/scripts/setup.mjs
   ```
   (Re-run is safe — collections are created only if missing.)
5. Restart `./pocketbase serve` whenever developing.

## Smoke test
1. Visit http://localhost:3000 → click "Create account" → sign up.
2. On dashboard, click "New Project", create a project.
3. Click into the project → click "Add item" → add an inventory item.
4. From Documents, click "Upload Document", upload a PDF or image.
5. Sign out via user menu → sign back in.
6. Confirm: only your projects/docs/inventory are visible (create a second user to test isolation).
