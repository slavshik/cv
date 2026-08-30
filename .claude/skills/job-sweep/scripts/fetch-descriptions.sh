#!/bin/bash
# Fetch full descriptions for every URL in <outdir>/shortlist.txt.
# Usage: scripts/fetch-descriptions.sh <outdir>
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:?usage: fetch-descriptions.sh <outdir>}"
D="$(cat "$ROOT/scripts/desc.js")"
: > "$OUT/desc.ndjson"
i=0
while read -r url; do
  [ -z "$url" ] && continue
  i=$((i + 1))
  agent-browser open "$url" >/dev/null 2>&1
  agent-browser eval "$D" 2>/dev/null | python3 "$ROOT/scripts/_desc.py" "$url" >> "$OUT/desc.ndjson"
  echo "  [$i] $url" >&2
  sleep 2
done < "$OUT/shortlist.txt"
echo "DESC DONE $i -> $OUT/desc.ndjson" >&2
