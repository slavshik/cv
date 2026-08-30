#!/bin/bash
# Harvest LinkedIn guest job listings for every query in queries.tsv.
# Usage: scripts/sweep.sh [outdir] [days]
#   outdir  default runs/<today>
#   days    posting age window in days, default 30
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/runs/$(date +%F)}"
DAYS="${2:-30}"
SECS=$((DAYS * 86400))
mkdir -p "$OUT"
EXTRACT="$(cat "$ROOT/scripts/extract.js")"
: > "$OUT/raw.ndjson"

enc() { python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$1"; }

while IFS=$'\t' read -r kw loc extra; do
  [ -z "${kw:-}" ] && continue
  case "$kw" in \#*) continue ;; esac
  for start in 0 25 50; do
    url="https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=$(enc "$kw")&location=$(enc "${loc:-}")&start=${start}&f_TPR=r${SECS}${extra:-}"
    agent-browser open "$url" >/dev/null 2>&1
    agent-browser eval "$EXTRACT" 2>/dev/null | python3 "$ROOT/scripts/_rows.py" "$kw" "${loc:-}" >> "$OUT/raw.ndjson"
    echo "  [$kw | ${loc:-} | start=$start] rows=$(wc -l < "$OUT/raw.ndjson")" >&2
    sleep 2
  done
done < "$ROOT/queries.tsv"

echo "SWEEP DONE $(wc -l < "$OUT/raw.ndjson") rows -> $OUT/raw.ndjson" >&2
