# Plan: Commit WIP + Push to New GitHub Repo

## Summary
Stage all 47 modified/untracked files in `/workspace` (the WIP on `main`), commit them in a single commit, add a new GitHub repo URL as the `origin` remote, push, and verify.

## Current State Analysis
- **Repo:** `/workspace` is a git repo on `main`. Last commit: `4af553a7 chore: ignore pnpm-store`. No remote configured.
- **Uncommitted work:** 47 files changed (+2587 / -990):
  - 13 new untracked files (marketing pages, api routes, share view, theme, settings, several new dashboard components, hooks, lib helpers, new UI primitives).
  - 23 modified files across `frontend/app/`, `frontend/components/`, `frontend/hooks/`, `frontend/lib/`.
  - 6 deleted files (`page.tsx`, `dev.sh`, `setup.mjs`, `project-status-chart.tsx`, etc.).
  - 2 backend files changed (`CHANGELOG.md`, `download-pocketbase.sh`).
- **Git identity:** configured (`TRAE SOLO <trae@local>`). Will use this for the commit.
- **`gh` CLI:** not installed. User will create the empty repo on github.com and provide the URL.
- **Remote:** none. Need to add `origin` after user provides URL.
- **Test status:** UI E2E 90/90, `e2e.mjs` 24/24, `frontend-routes.mjs` 15/15. All green in the local stack.

## Proposed Changes

### Step 1: Get the repo URL from the user
- Ask the user to paste the empty-repo URL (e.g. `https://github.com/<owner>/<repo>.git`).
- Validate format with a quick `git ls-remote --heads` against the URL (read-only, will fail with a clear error if the URL is wrong or the repo doesn't exist yet, but won't push anything).

### Step 2: Add the remote
- `git remote add origin <url>` (read-only verification of the remote first).
- `git fetch --no-tags origin` to make sure the local branch can be pushed (read-only).

### Step 3: Stage and commit
- `git add -A` to stage all 47 files (modified + new + deleted).
- Single commit with a Conventional Commits message. Suggested:

  ```
  feat: full GC Pallet MVP — projects, inventory, documents, share links, design system

  - Auth (login/register), useAuth, and a mounted-aware DashboardGate that
    prevents SSR/CSR hydration mismatches.
  - Projects module (list, new, detail, status, actions, share dialog).
  - Inventory module (list, add, per-location totals).
  - Documents module (list, upload, project filter, serving via PocketBase).
  - Public share view at /share/[token] with a server-side direct-fetch
    route that bypasses the PocketBase JS SDK to avoid a stale `revoked`
    flag.
  - Marketing pages (/, /pricing, /features, /about, /contact, /legal/*).
  - Design system pass: tokenized theme (light/dark/system), updated
    shadcn-style UI primitives, topbar + sidebar + user menu.
  - Hydration sweep: mounted-guards in greeting, user-menu, profile-form.
  - Backend tooling: CHANGELOG, pocketbase download helper.
  - Frontend + backend E2E tests all green: ui-e2e 90/90, e2e.mjs 24/24,
    frontend-routes.mjs 15/15.
  ```

- Use HEREDOC to pass the message (per repo convention).

### Step 4: Push
- `git push -u origin main` (only run after the user confirms URL and gives the green light; push to `main` is requested by the user explicitly, but the system-prompt says to warn before pushing to main — include a one-line warning in the final response).

### Step 5: Verify
- `git ls-remote --heads origin main` to confirm the push landed.
- `git log --oneline -3` to confirm the new commit is on `origin/main`.

## Assumptions & Decisions
1. **Single commit, not grouped.** The user explicitly chose "Commit everything (all 47)" — no need to split into 2-3 logical commits.
2. **Use existing git identity.** `TRAE SOLO <trae@local>` is the configured identity; will not touch git config.
3. **Push to `main`.** The user did not ask for a feature branch. The system rule is to warn before pushing to main, but the user's explicit "commit everything" implies they're OK with this. Include the warning in the final response.
4. **No force-push, no `--force-with-lease`.** The repo is new and has no remote history, so a normal `-u origin main` push is the right tool.
5. **No additional code changes.** This is a commit-and-push task only. If the WIP is broken, the push will still succeed (git doesn't care about test status), and the user can iterate. If they want a pre-push sanity check, they can ask.
6. **PAT / SSH not needed.** User is creating the repo and providing the URL. The push will only succeed if the local environment has credentials configured for the remote host (e.g. `~/.gitconfig` credential helper, or `~/.ssh/config` for SSH URLs). If it fails with an auth error, surface the exact error to the user and stop.

## Verification
1. `git log --oneline -3` — new commit is on `main` locally.
2. `git remote -v` — `origin` points at the user-supplied URL.
3. `git ls-remote --heads origin main` — the new commit hash appears on the remote.
4. `git status` — clean working tree, branch is up to date with `origin/main`.
