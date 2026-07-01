#!/usr/bin/env bash
# Wait for PocketBase to be healthy, then create the collections idempotently.
# Runs inside the backend container. Called by an init container in compose.
#
# Reads ADMIN_EMAIL and ADMIN_PASSWORD from the environment, plus PB_URL
# (defaults to http://127.0.0.1:8090 inside the compose network).
#
# Idempotent: creates collections only if they don't exist, so re-runs are safe.

set -euo pipefail

PB_URL="${PB_URL:-http://127.0.0.1:8090}"
ADMIN_EMAIL="${ADMIN_EMAIL:?ADMIN_EMAIL is required}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:?ADMIN_PASSWORD must be at least 10 chars}"

echo "[bootstrap] waiting for ${PB_URL}/api/health …"
for i in $(seq 1 60); do
  if curl -fsS "${PB_URL}/api/health" >/dev/null 2>&1; then
    echo "[bootstrap] PB is up"
    break
  fi
  sleep 2
done

if ! curl -fsS "${PB_URL}/api/health" >/dev/null; then
  echo "[bootstrap] PB never became healthy; aborting"
  exit 1
fi

# The first-time setup of PB requires a superuser. If one doesn't exist
# yet, the admin UI is open; we cannot create the superuser via API
# (PB requires the admin UI for the first one). The user does this step
# once via the UI; after that, this script just creates collections via
# the admin API.

# Authenticate as the superuser.
AUTH_PAYLOAD=$(printf '{"identity":"%s","password":"%s"}' "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
TOKEN=$(curl -fsS -X POST "${PB_URL}/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "$AUTH_PAYLOAD" \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -z "${TOKEN:-}" ]; then
  echo "[bootstrap] WARN: no superuser found at ${ADMIN_EMAIL}."
  echo "[bootstrap] Please open ${PB_URL}/_/ and create the superuser manually."
  echo "[bootstrap] Then re-run this script or restart the backend container."
  exit 0
fi

echo "[bootstrap] authenticated as ${ADMIN_EMAIL}"

# Helper: list existing collections.
list_collections() {
  curl -fsS "${PB_URL}/api/collections?perPage=500" \
    -H "Authorization: ${TOKEN}" \
    | grep -oE '"name":"[^"]+"' | sort -u
}

EXISTING=$(list_collections || true)
echo "[bootstrap] existing collections: ${EXISTING}"

create_collection() {
  local body="$1"
  local name
  name=$(printf '%s' "$body" | grep -oE '"name":"[^"]+"' | head -1 | cut -d'"' -f4)
  if echo "$EXISTING" | grep -q "\"${name}\""; then
    echo "[bootstrap] skip ${name} (already exists)"
    return 0
  fi
  echo "[bootstrap] create ${name} …"
  curl -fsS -X POST "${PB_URL}/api/collections" \
    -H "Authorization: ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$body" >/dev/null
  echo "[bootstrap]   + created ${name}"
}

# Mirror of the schema created in pb_migrations/, so this script is the
# source of truth even on a fresh deploy without migrations. The real
# migrations in /pb_migrations are still applied on every boot via
# --autoMigrate; this just makes the very first boot resilient.

create_collection '{
  "name": "users",
  "type": "auth",
  "listRule": "id = @request.auth.id",
  "viewRule": "id = @request.auth.id",
  "createRule": "",
  "updateRule": "id = @request.auth.id",
  "deleteRule": "id = @request.auth.id",
  "fields": [
    {"name":"name","type":"text","required":true,"min":1,"max":120},
    {"name":"company_name","type":"text","required":false,"max":160},
    {"name":"phone","type":"text","required":false,"max":40}
  ]
}'

create_collection '{
  "name": "projects",
  "type": "base",
  "listRule": "@request.auth.id != \"\"",
  "viewRule": "@request.auth.id != \"\"",
  "createRule": "@request.auth.id != \"\"",
  "updateRule": "@request.auth.id != \"\"",
  "deleteRule": "@request.auth.id != \"\"",
  "fields": [
    {"name":"name","type":"text","required":true,"min":1,"max":200},
    {"name":"address","type":"text","required":false,"max":400},
    {"name":"status","type":"select","required":true,"maxSelect":1,"values":["active","on_hold","completed","archived"]},
    {"name":"budget","type":"number","required":false,"min":0},
    {"name":"start_date","type":"date","required":false},
    {"name":"end_date","type":"date","required":false"}
  ]
}'

create_collection '{
  "name": "inventory",
  "type": "base",
  "listRule": "@request.auth.id != \"\"",
  "viewRule": "@request.auth.id != \"\"",
  "createRule": "@request.auth.id != \"\"",
  "updateRule": "@request.auth.id != \"\"",
  "deleteRule": "@request.auth.id != \"\"",
  "fields": [
    {"name":"item_name","type":"text","required":true,"min":1,"max":200},
    {"name":"quantity","type":"number","required":true,"min":0},
    {"name":"unit","type":"text","required":false,"max":40},
    {"name":"location","type":"text","required":false,"max":200},
    {"name":"cost_per_unit","type":"number","required":false,"min":0},
    {"name":"last_updated","type":"date","required":false}
  ]
}'

create_collection '{
  "name": "documents",
  "type": "base",
  "listRule": "@request.auth.id != \"\"",
  "viewRule": "@request.auth.id != \"\"",
  "createRule": "@request.auth.id != \"\"",
  "updateRule": "@request.auth.id != \"\"",
  "deleteRule": "@request.auth.id != \"\"",
  "fields": [
    {"name":"name","type":"text","required":true,"min":1,"max":200},
    {"name":"category","type":"select","required":true,"maxSelect":1,"values":["permit","contract","plan","photo","other"]},
    {"name":"file","type":"file","required":true,"maxSelect":1,"maxSize":52428800,"mimeTypes":["application/pdf","image/png","image/jpeg","image/webp"]},
    {"name":"project","type":"relation","required":false,"maxSelect":1,"collectionId":"PROJECTS_PLACEHOLDER"}
  ]
}'

create_collection '{
  "name": "contact_messages",
  "type": "base",
  "listRule": null,
  "viewRule": null,
  "createRule": "",
  "updateRule": null,
  "deleteRule": null,
  "fields": [
    {"name":"name","type":"text","required":true,"min":1,"max":120},
    {"name":"email","type":"email","required":true},
    {"name":"message","type":"text","required":true,"min":1,"max":4000}
  ]
}'

create_collection '{
  "name": "shares",
  "type": "base",
  "listRule": "created_by = @request.auth.id",
  "viewRule": "",
  "createRule": "@request.auth.id != \"\"",
  "updateRule": "created_by = @request.auth.id",
  "deleteRule": "created_by = @request.auth.id",
  "fields": [
    {"name":"token","type":"text","required":true,"min":32,"max":64},
    {"name":"resource","type":"text","required":true},
    {"name":"revoked","type":"bool","required":false},
    {"name":"expires_at","type":"date","required":false},
    {"name":"view_count","type":"number","required":false,"min":0},
    {"name":"created_by","type":"text","required":true}
  ]
}'

echo "[bootstrap] done"
