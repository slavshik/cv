"""Turn one description eval result into an NDJSON row. Internal to fetch-descriptions.sh."""
import sys, json

raw = sys.stdin.read().strip()
try:
    s = json.loads(raw)
    o = json.loads(s) if isinstance(s, str) else s
except Exception:
    o = {"body": ""}

o["url"] = sys.argv[1]
print(json.dumps(o))
