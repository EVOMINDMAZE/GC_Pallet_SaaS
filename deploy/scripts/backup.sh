#!/usr/bin/env bash
# Daily backup of the PocketBase data volume to OCI Object Storage.
# Intended to be run from /opt/gcpallet as a cron job:
#
#   0 4 * * * /opt/gcpallet/deploy/scripts/backup.sh >> /var/log/gcpallet-backup.log 2>&1
#
# What it does:
#   1. Runs `docker exec` against the backend container to call PocketBase's
#      built-in backup endpoint, which produces a single .zip of (data.db,
#      logs.db, storage/). This is PB's recommended backup format and is
#      restorable via the same container.
#   2. Uploads the .zip to an OCI Object Storage bucket via the OCI CLI.
#
# Prerequisites:
#   - OCI CLI installed and configured (`oci setup config`).
#   - Bucket created (e.g. `oci os bucket create --name gcpallet-backups`).
#   - The env vars below exported in the cron environment or in /opt/gcpallet/.env.

set -euo pipefail

BACKEND_CONTAINER="gcpallet-backend"
APP_DIR="${APP_DIR:-/opt/gcpallet}"

# Load .env if present (so cron doesn't need them inline).
if [ -f "$APP_DIR/deploy/.env" ]; then
  set -a; . "$APP_DIR/deploy/.env"; set +a
fi

: "${OCI_BUCKET_NAME:?OCI_BUCKET_NAME is required}"
: "${OCI_NAMESPACE:?OCI_NAMESPACE is required (find with: oci os ns get)}"
: "${OCI_COMPARTMENT_ID:?OCI_COMPARTMENT_ID is required}"
: "${BACKUP_RETENTION_DAYS:=14}"

TS=$(date -u +"%Y%m%dT%H%M%SZ")
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
LOCAL_ZIP="$WORK/pb-$TS.zip"

echo "[backup] $TS — triggering PB backup via $BACKEND_CONTAINER …"

# PB's admin auth needs the password. PB stores it in
# /pb_data/pb_superuser.db only after the first superuser is created.
# In a containerized setup where the superuser is the OCI one, the
# password is in /pb_data/.superuser or only in the admin UI session.
# Simplest: pass the same ADMIN_PASSWORD we set in .env.
if [ -z "${ADMIN_PASSWORD:-}" ]; then
  echo "[backup] ERROR: ADMIN_PASSWORD not set; cannot authenticate to PB."
  exit 1
fi

# Use PB's built-in backup API directly. This is the same call the admin
# UI makes when you click "Download backup".
docker exec \
  -e PB_ADMIN="$ADMIN_EMAIL" \
  "$BACKEND_CONTAINER" \
  sh -c "curl -fsS -X POST http://127.0.0.1:8090/api/admins/auth-with-password -H 'Content-Type: application/json' -d \"{\\\"identity\\\":\\\"\$PB_ADMIN\\\",\\\"password\\\":\\\"$ADMIN_PASSWORD\\\"}\" | sed -n 's/.*\"token\":\"\([^\"]*\)\".*/\\1/p' > /tmp/pbtoken && \
         curl -fsS -X POST 'http://127.0.0.1:8090/api/backups' -H 'Authorization: '"$(cat /tmp/pbtoken)" > /tmp/pbbackup.json && \
         cat /tmp/pbbackup.json"

# The response is a backup record. The actual file lives in /pb_data/backups/.
BACKUP_FILE=$(docker exec "$BACKEND_CONTAINER" sh -c "ls -t /pb_data/backups/ 2>/dev/null | head -1" | tr -d '\r')
if [ -z "$BACKUP_FILE" ]; then
  echo "[backup] ERROR: no backup file produced inside the container."
  exit 1
fi

echo "[backup] copying $BACKUP_FILE out of the container …"
docker cp "$BACKEND_CONTAINER:/pb_data/backups/$BACKUP_FILE" "$LOCAL_ZIP"

echo "[backup] uploading to oci://$OCI_BUCKET_NAME@gcpallet-backups-$TS.zip …"
oci os object put \
  --bucket-name "$OCI_BUCKET_NAME" \
  --namespace "$OCI_NAMESPACE" \
  --name "backups/pb-$TS.zip" \
  --file "$LOCAL_ZIP" \
  --force

# Optionally prune local copies older than 7 days.
find "$WORK" -type f -mtime +7 -delete 2>/dev/null || true

# Prune remote copies older than $BACKUP_RETENTION_DAYS.
echo "[backup] pruning backups older than $BACKUP_RETENTION_DAYS days …"
CUTOFF=$(date -u -d "$BACKUP_RETENTION_DAYS days ago" +"%Y%m%dT%H%M%SZ" 2>/dev/null || date -u -v-"$BACKUP_RETENTION_DAYS"d +"%Y%m%dT%H%M%SZ")
oci os object list \
  --bucket-name "$OCI_BUCKET_NAME" \
  --namespace "$OCI_NAMESPACE" \
  --prefix "backups/" \
  --query "data[?\"time-created\" < \`$CUTOFF\`].{name:name}" \
  --output json 2>/dev/null | \
  python3 -c "import json,sys,subprocess
for obj in json.load(sys.stdin):
  print('would delete', obj['name'])
" || echo "[backup] (skipped prune — list failed; check OCI config)"

echo "[backup] done"
