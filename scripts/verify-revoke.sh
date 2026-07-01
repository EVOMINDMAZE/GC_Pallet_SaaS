#!/usr/bin/env bash
# Verify the share-revoke fix after deploy.
#
# Usage: HOST=https://gc-pallet-saas-evomindmazes-projects.vercel.app TOKEN=<token> ./scripts/verify-revoke.sh
#
# The script expects a TOKEN that was just created via the project's
# Shares tab and is still active. Step 1 hits the public read to
# confirm the active state. Step 2 expects the user to revoke the
# share in the UI, then we re-curl to confirm a 410.

set -euo pipefail

HOST="${HOST:-https://gc-pallet-saas-evomindmazes-projects.vercel.app}"
TOKEN="${TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  echo "TOKEN env var is required." >&2
  exit 2
fi

URL="$HOST/api/shares/$TOKEN"

echo "→ step 1: public read of active share (expect 200, ok:true)"
curl -sS -i "$URL" | head -20
echo

echo "→ next: revoke the share in the UI, then press Enter to continue"
read -r _

echo "→ step 2: public read after revoke (expect 410, reason:revoked)"
curl -sS -i "$URL" | head -20
echo

echo "→ step 3: open $HOST/share/$TOKEN in incognito — expect 'Link revoked' screen"
