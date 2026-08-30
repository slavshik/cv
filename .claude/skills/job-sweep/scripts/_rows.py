"""Turn one agent-browser eval result into NDJSON rows. Internal to sweep.sh."""
import sys, json

raw = sys.stdin.read().strip()
try:
    s = json.loads(raw)
    arr = json.loads(s) if isinstance(s, str) else s
except Exception:
    sys.exit(0)

for j in arr or []:
    j["q"] = sys.argv[1]
    j["qloc"] = sys.argv[2]
    print(json.dumps(j))
