#!/usr/bin/env bash
# Start PB, ensure collections exist (run setup script if not), keep serving.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${ADMIN_EMAIL:-}" ] || [ -z "${ADMIN_PASSWORD:-}" ]; then
  echo "Set ADMIN_EMAIL and ADMIN_PASSWORD before running." >&2
  exit 1
fi

./pocketbase serve --http=127.0.0.1:8090 &
PB_PID=$!
trap "kill $PB_PID 2>/dev/null || true" EXIT

# wait for boot
for i in $(seq 1 30); do
  sleep 1
  if curl -sf http://127.0.0.1:8090/api/health >/dev/null 2>&1; then
    break
  fi
done

# run setup (idempotent)
ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" PB_URL=http://127.0.0.1:8090 \
  node scripts/setup.mjs || { kill $PB_PID; exit 1; }

echo
echo "PocketBase running on http://127.0.0.1:8090"
echo "Admin UI:        http://127.0.0.1:8090/_/"
echo

wait $PB_PID
