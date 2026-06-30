#!/usr/bin/env bash
set -euo pipefail
VERSION="0.22.46"
OUT="$(dirname "$0")/../pocketbase"
URL="https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/pocketbase_${VERSION}_linux_amd64.zip"
TMP="$(mktemp -d)"
curl -L "$URL" -o "$TMP/pb.zip"
unzip -o "$TMP/pb.zip" -d "$(dirname "$OUT")"
chmod +x "$OUT"
rm -rf "$TMP"
echo "PocketBase ${VERSION} installed at $OUT"
