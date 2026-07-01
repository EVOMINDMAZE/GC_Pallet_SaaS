# GC Pallet — Production Deployment

Docker Compose stack for deploying the full GC Pallet application
(Next.js frontend + PocketBase backend) to Oracle Cloud Always Free,
or any Linux VM with Docker.

## What's in here

| File | Purpose |
|---|---|
| `Dockerfile.frontend` | Multi-stage Next.js build → standalone runtime image |
| `Dockerfile.backend` | PocketBase + migrations + bootstrap script |
| `docker-compose.yml` | Orchestrates backend, frontend, Caddy, and a one-shot bootstrap container |
| `Caddyfile` | TLS termination (Let's Encrypt) + reverse proxy |
| `.env.example` | Template for the environment file |
| `scripts/init-vm.sh` | One-shot setup for a fresh Oracle Linux / Ubuntu VM |
| `scripts/backup.sh` | Daily PB backup → OCI Object Storage |
| `scripts/restore.sh` | Restore a PB backup from OCI |
| `scripts/wait-and-bootstrap.sh` | Runs inside the backend container to create collections idempotently |
| `scripts/seed-superuser.sh` | Placeholder for first-time superuser creation |
| `DEPLOY.md` | **The step-by-step guide for humans.** Start here. |

## Quickstart

```bash
# On a fresh Oracle Cloud Always Free VM:
bash <(curl -fsSL https://raw.githubusercontent.com/EVOMINDMAZE/GC_Pallet_SaaS/main/deploy/scripts/init-vm.sh)
```

Then follow `DEPLOY.md` for the human-only steps (DNS, superuser creation,
optional backups).

## Local-only smoke test

```bash
cp deploy/.env.example deploy/.env
# Edit DOMAIN, ADMIN_EMAIL, ADMIN_PASSWORD.
docker compose -f deploy/docker-compose.yml up --build
```

Visit `http://localhost` (or `http://<your-DOMAIN>` if set in `/etc/hosts`).
