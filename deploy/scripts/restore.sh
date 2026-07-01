#!/usr/bin/env bash
# Restore a PB backup from OCI Object Storage.
#
# Usage:
#   APP_DIR=/opt/gcpallet bash deploy/scripts/restore.sh backups/pb-20260101T040000Z.zip
#
# What it does:
#   1. Downloads the requested backup from the configured OCI bucket.
#   2. Stops the backend container.
#   3. Replaces /pb_data/data.db and /pb_data/storage/ with the backup contents.
#   4. Restarts the backend; PB re-bootstraps the schema on first request.

set -euo pipefail

BACKUP_PATH="${1:?Usage: restore.sh <object-name>}"
APP_DIR="${APP_DIR:-/opt/gcpallet}"
BACKEND_CONTAINER="gcpallet-backend"

if [ -f "$APP_DIR/deploy/.env" ]; then
  set -a; . "$APP_DIR/deploy/.env"; set +a
fi
: "${OCI_BUCKET_NAME:?OCI_BUCKET_NAME required}"
: "${OCI_NAMESPACE:?OCI_NAMESPACE required}"

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
LOCAL_ZIP="$WORK/backup.zip"

echo "[restore] downloading $BACKUP_PATH from $OCI_BUCKET_NAME …"
oci os object get \
  --bucket-name "$OCI_BUCKET_NAME" \
  --namespace "$OCI_NAMESPACE" \
  --name "$BACKUP_PATH" \
  --file "$LOCAL_ZIP" \
  --force

echo "[restore] stopping backend …"
docker stop "$BACKEND_CONTAINER" || true

echo "[restore] unpacking into /pb_data …"
docker run --rm \
  -v gcpallet_pb_data:/pb_data \
  -v "$LOCAL_ZIP":/backup.zip \
  alpine sh -c "apk add --no-cache unzip >/dev/null && \
                rm -rf /pb_data/data.db /pb_data/logs.db /pb_data/storage && \
                unzip -o /backup.zip -d /pb_data"

echo "[restore] starting backend …"
docker start "$BACKEND_CONTAINER"

echo "[restore] done. Watch logs with: docker logs -f $BACKEND_CONTAINER"
