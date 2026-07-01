# GC Pallet — Production Deployment on Oracle Cloud Always Free

A complete, $0/month, production-grade deployment of GC Pallet on Oracle
Cloud's "Always Free" tier. Two services, Caddy in front, daily backups
to OCI Object Storage, HTTPS via Let's Encrypt.

**Total human time: ~25 minutes.** Most of the heavy lifting is the
`init-vm.sh` script that runs once on the VM.

---

## Architecture

```
[ Browser ]
   │  https://gcpallet.example.com
   ▼
[ Caddy :443 ]   ← Oracle Cloud VM (Ampere A1, Always Free)
   │                4 OCPUs + 24 GB RAM
   ├── /api/pb/*  →  PocketBase  :8090  (data: docker volume pb_data)
   ├── /_/*       →  PocketBase  :8090  (admin UI)
   └── /*         →  Next.js     :3000  (standalone build)
```

---

## 0. Prerequisites (you have these)

- [ ] An Oracle Cloud account on the **Always Free** tier
  ([cloud.oracle.com](https://cloud.oracle.com/)).
- [ ] A domain name you control (so you can point an A record at the VM).
- [ ] A terminal with `ssh` access to your local machine.

---

## 1. Create the VM (~5 minutes)

1. Log in to the OCI Console → **Compute → Instances → Create instance**.
2. **Name:** `gcpallet-prod`.
3. **Placement:** your home region (the Always Free capacity is regional).
4. **Image and shape:**
   - Image: **Oracle Linux 9** (or Ubuntu 22.04).
   - Shape: click **Edit** → **Ampere** → **VM.Standard.A1.Flex**.
   - **4 OCPUs, 24 GB RAM** (the Always Free max — use it all, the
     reservation is region-wide; if it errors with "Out of capacity",
     pick a different availability domain or try again in a few minutes).
5. **Networking:** accept the default VCN. Make sure **Assign a public IPv4
   address** is checked.
6. **SSH keys:** paste your public key (or have OCI generate one and
   download the private key).
7. Click **Create**. Wait ~2 minutes for it to provision.

### Open the right ports (security list)

OCI's default security list is restrictive. Open the right ports:

1. **Compute → Instances → gcpallet-prod → VCN** (click the VCN name).
2. **Subnets → public subnet → Security Lists → Default Security List**.
3. **Add Ingress Rules:**
   - **SSH (port 22)** — source: `0.0.0.0/0` (or your IP only for safety).
   - **HTTP (port 80)** — source: `0.0.0.0/0` (Caddy needs it for the
     Let's Encrypt HTTP-01 challenge before issuing the cert).
   - **HTTPS (port 443)** — source: `0.0.0.0/0`.

### Reserve a static public IP

1. **Networking → IP management → Reserved public IPs → Create reserved IP**.
2. **Create and associate** with the `gcpallet-prod` instance.
3. Note the IP — this is what DNS will point at.

---

## 2. Point DNS at the VM (~1 minute)

In your domain registrar's control panel:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `gcpallet.example.com` (or `@` for the root) | the reserved IP | 300 |

If you're using a subdomain, replace `gcpallet.example.com` with whatever
you chose and update `DOMAIN` in `.env` accordingly. **The DNS must be live
before you continue** — Caddy can't get a cert otherwise.

---

## 3. Run the one-shot init script (~10 minutes)

SSH into the VM:

```bash
ssh -i ~/.ssh/<your-private-key> opc@<the-public-ip>
# (or ubuntu@… if you picked Ubuntu)
```

Install git and run the script:

```bash
sudo dnf install -y git    # Oracle Linux — Ubuntu users: sudo apt install -y git
bash <(curl -fsSL https://raw.githubusercontent.com/EVOMINDMAZE/GC_Pallet_SaaS/main/deploy/scripts/init-vm.sh)
```

The script will:

1. Install Docker + Compose plugin.
2. Tell you to log out / back in (so the `docker` group takes effect).
3. After re-login, run the script **a second time** — it will:
   - Install the OCI CLI (used for backups).
   - Clone the repo to `/opt/gcpallet`.
   - Generate a strong `ADMIN_PASSWORD` and write `deploy/.env`.
   - **Pause and ask you to edit `deploy/.env` to set `DOMAIN=...`** —
     do that now, then re-run the script.
   - Build the images and start the stack.
4. Print a summary with the URLs you need.

---

## 4. First-time PocketBase setup (~2 minutes)

1. Open **https://gcpallet.example.com/\_/** in a browser.
2. The PocketBase admin UI loads. Create the **first superuser** with the
   `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `deploy/.env`. (PB requires
   this be done via the UI; subsequent restarts don't need it.)
3. The `bootstrap` container (defined in `docker-compose.yml`) sees the
   superuser exists, authenticates, and creates the `users`, `projects`,
   `inventory`, `documents`, `contact_messages`, and `shares` collections
   if they don't exist yet. It's idempotent — safe to run multiple times.
4. Wait ~10 seconds, then refresh. You should see all six collections in
   the PB admin UI.
5. Open **https://gcpallet.example.com/** — the marketing site loads.
6. Click **Create account** → sign up → land on the dashboard. 🎉

---

## 5. (Optional) Set up OCI backups (~5 minutes)

If you want the daily backup script to work:

1. **On the VM**, run `oci setup config` and paste your OCI user OCID,
   tenancy OCID, region, and generate an API key. Save the key fingerprint.
2. Upload the matching **public** key to the OCI user's settings.
3. Create a bucket:
   ```bash
   oci os bucket create --name gcpallet-backups --compartment-id <your-compartment-ocid>
   ```
4. Add the values to `/opt/gcpallet/deploy/.env`:
   ```
   OCI_BUCKET_NAME=gcpallet-backups
   OCI_NAMESPACE=$(oci os ns get | jq -r .data)
   OCI_COMPARTMENT_ID=<your-compartment-ocid>
   ```
5. Add a daily cron:
   ```bash
   crontab -e
   0 4 * * * /opt/gcpallet/deploy/scripts/backup.sh >> /var/log/gcpallet-backup.log 2>&1
   ```

---

## 6. (Optional) Frontend behind a CDN

If you want to put Cloudflare in front:

1. Add the domain to Cloudflare (free plan).
2. Set the A record to the Oracle IP, **proxied** (orange cloud).
3. In Caddy, change the Caddyfile's `{$DOMAIN:localhost}` to your domain
   and set `servers { trusted_proxies static <cloudflare-ips> }`.
4. Restart `caddy`. Cloudflare handles the public TLS, Caddy still
   serves the backend.

For most users, the direct Caddy → Caddy TLS is enough. Skip this step
unless you need the CDN.

---

## Updating the app

```bash
ssh opc@<the-public-ip>
cd /opt/gcpallet
git pull
docker compose -f deploy/docker-compose.yml build
docker compose -f deploy/docker-compose.yml up -d
```

---

## Useful commands (on the VM)

```bash
# Status
docker compose -f deploy/docker-compose.yml ps

# Tail logs
docker compose -f deploy/docker-compose.yml logs -f frontend
docker compose -f deploy/docker-compose.yml logs -f backend

# Restart one service
docker compose -f deploy/docker-compose.yml restart backend

# Manual backup
sudo bash /opt/gcpallet/deploy/scripts/backup.sh

# Restore from a backup
sudo APP_DIR=/opt/gcpallet bash /opt/gcpallet/deploy/scripts/restore.sh backups/pb-20260101T040000Z.zip
```

---

## Costs

| Resource | Free tier allowance | What we use |
|---|---|---|
| VM compute | 4 OCPU + 24 GB RAM (Always Free) | 4 OCPU + 12 GB RAM (ample) |
| Block storage | 200 GB (Always Free) | 50 GB for PB data (default) |
| Object Storage | 10 GB (Always Free) | ~1 GB for daily backups |
| Outbound data | 10 TB/mo (Always Free) | a few GB/mo for a small app |
| Public IP | 1 always-free reserved IP | 1 |

**Total: $0/month.** The "Always Free" tier never expires.

---

## Troubleshooting

**"Out of capacity" when creating the VM.**
The Ampere A1 free tier is shared across all users in your region. Try
a different availability domain, or wait a few hours and retry.

**Caddy can't get a cert.**
DNS isn't pointing at the VM yet. Verify with `dig gcpallet.example.com`
— the A record should return the reserved IP.

**PB admin UI shows "no collections".**
The bootstrap container runs once after PB is healthy. If the superuser
wasn't created first, it exits cleanly without doing anything. Create
the superuser via the UI, then:
```bash
docker compose -f deploy/docker-compose.yml up bootstrap
```

**Frontend shows 502.**
`docker compose ps` — the frontend is probably still starting up (it
waits for the backend to be healthy). Wait 30 seconds.

**PB data disappeared after a container restart.**
Make sure the `pb_data` volume is mounted. `docker volume inspect gcpallet_pb_data`.
If you used `docker compose down` instead of `docker compose stop`, the
volume survives — but `docker compose down -v` would have removed it.
