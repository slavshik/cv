"""Dedupe, score and rank a sweep against Alexander's stack.

Usage: python3 scripts/score.py <outdir> [--mark-seen] [--new-only]

Reads   <outdir>/raw.ndjson
Writes  <outdir>/scored.json      every unique posting, ranked
        runs/seen.json            url -> date first surfaced (with --mark-seen)
Prints  a ranked table for triage.

The score is a coarse title/company filter whose only job is to decide which
postings are worth spending a description fetch on. It is not the verdict —
SKILL.md is clear that the ranking comes from reading the descriptions.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

args = [a for a in sys.argv[1:] if not a.startswith("--")]
flags = {a for a in sys.argv[1:] if a.startswith("--")}
if not args:
    sys.exit("usage: score.py <outdir> [--mark-seen] [--new-only]")

out = Path(args[0])
root = Path(__file__).resolve().parent.parent
seen_path = root / "runs" / "seen.json"

rows = [json.loads(l) for l in (out / "raw.ndjson").read_text().splitlines() if l.strip()]

jobs = {}
for r in rows:
    u = r["url"]
    if u in jobs:
        jobs[u]["queries"].add(r["q"])
        continue
    r["queries"] = {r["q"]}
    jobs[u] = r

# --- weights -------------------------------------------------------------
# STRONG: the domain and rendering stack Alexander actually owns.
STRONG = {
    r"\bgame": 4,
    r"igaming|casino|slot|betting|gambling|wager": 4,
    r"pixi|phaser|webgl|canvas|cocos|babylon|three\.?js": 4,
    r"html5": 3,
    r"typescript": 3,
}
GOOD = {
    r"\bfront.?end\b|\bfrontend\b": 3,
    r"\breact\b": 2,
    r"javascript|\bjs\b": 2,
    r"mobx|redux": 2,
    r"\bweb\b": 1,
    r"node": 1,
}
SENIOR = {r"senior|lead|principal|staff|sr\.": 2}
# NEG: off-stack or off-role. Tuned against real false positives — AAA C++
# studios and Angular/Vue shops both score well on title alone otherwise.
NEG = {
    r"\bangular\b": -3,
    r"\bvue\b": -3,
    r"\.net|c#\b|\bjava\b(?!script)": -3,
    r"\bphp\b|\bruby\b|\bgolang\b|\bpython\b": -2,
    r"\bqa\b|tester|manual": -4,
    r"\bandroid\b|\bios\b|flutter|react native|kotlin|swift": -3,
    r"intern|junior|graduate|trainee": -4,
    r"designer|artist|ux/ui|producer|manager|analyst|marketing|recruit": -4,
    r"\bunreal\b|\bc\+\+": -3,
    r"data engineer|devops|sre|backend engineer": -3,
    r"\bunity\b": -1,
}
GAMING_CO = re.compile(
    r"aristocrat|igt|evolution|leovegas|playtika|betsson|kindred|pragmatic|entain|"
    r"flutter ent|888|bet365|superbet|sportradar|greentube|novomatic|yggdrasil|relax gaming|playson|"
    r"wargaming|ten square|huuuge|tripledot|playtech|light ?& ?wonder|softswiss|betby|slotegrator|"
    r"gamesys|skywind|spribe|onetouch|betsoft|endorphina|gamzix|3 ?oaks|amusnet|ezugi|pateplay|"
    r"cd projekt|techland|11 bit|people can fly|bloober|creative assembly|king\b|zynga|voodoo|"
    r"gismart|frvr|patrianna|kaizen|game|studio|entertainment|interactive|casino|bet\b",
    re.I,
)


def score(j):
    t = (j["title"] or "").lower()
    c = (j["company"] or "").lower()
    s = 0
    why = []
    for pat, w in {**STRONG, **GOOD, **SENIOR}.items():
        if re.search(pat, t):
            s += w
            why.append(f"+{w} {pat}")
    for pat, w in NEG.items():
        if re.search(pat, t):
            s += w
            why.append(f"{w} {pat}")
    if GAMING_CO.search(c):
        s += 3
        why.append("+3 games/igaming company")
    loc = (j["loc"] or "").lower()
    if "warsaw" in loc:
        s += 2
    elif "poland" in loc:
        s += 1
    j["score"] = s
    j["why"] = why


for j in jobs.values():
    score(j)

# --- what is new since last week ----------------------------------------
seen = json.loads(seen_path.read_text()) if seen_path.exists() else {}
today = date.today().isoformat()
for u, j in jobs.items():
    j["new"] = u not in seen
    j["first_seen"] = seen.get(u, today)

if "--mark-seen" in flags:
    for u, j in jobs.items():
        seen.setdefault(u, today)
    seen_path.parent.mkdir(parents=True, exist_ok=True)
    seen_path.write_text(json.dumps(seen, indent=0, sort_keys=True))

ranked = sorted(jobs.values(), key=lambda j: (-j["score"], j["date"] or ""))
(out / "scored.json").write_text(
    json.dumps(
        [
            {k: v for k, v in j.items() if k != "queries"} | {"queries": sorted(j["queries"])}
            for j in ranked
        ],
        indent=1,
    )
)

shown = [j for j in ranked if j["new"]] if "--new-only" in flags else ranked
n_new = sum(1 for j in ranked if j["new"])
print(f"unique: {len(ranked)} (from {len(rows)} rows)   new since last run: {n_new}")
print(f"score>=8: {sum(1 for j in ranked if j['score'] >= 8)}   >=5: {sum(1 for j in ranked if j['score'] >= 5)}")
print()
for j in shown[:60]:
    mark = "NEW" if j["new"] else "   "
    print(
        f"{mark} {j['score']:>3}  {j['date']}  {(j['title'] or '')[:56]:<56} | "
        f"{(j['company'] or '')[:26]:<26} | {(j['loc'] or '')[:28]}"
    )
