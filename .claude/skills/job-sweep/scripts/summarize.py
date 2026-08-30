"""Condense fetched descriptions into stack signals for reading.

Usage: python3 scripts/summarize.py <outdir>

Never dump desc.ndjson raw — 32 descriptions is ~45 kB and reading it whole
crowds out the judgement the skill actually asks for. This prints, per posting,
only the stack terms that matched, the work-model line, and the seniority, which
is enough to tier a role and to spot the C++/Java/Angular impostors.
"""
import json
import re
import sys
from pathlib import Path

if len(sys.argv) < 2:
    sys.exit("usage: summarize.py <outdir>")
out = Path(sys.argv[1])

TERMS = [
    "TypeScript", "JavaScript", "React", "MobX", "Redux", "PixiJS", "Pixi", "Phaser",
    "Three.js", "Babylon", "Cocos", "WebGL", "Canvas", "HTML5", "Spine", "GSAP",
    "Node", "NestJS", "Next.js", "WebSocket", "GraphQL", "Storybook", "Jest",
    "Playwright", "i18n", "Docker", "Go", "Python",
    "Vue", "Angular", "Unity", "C++", "C#", "Java",
    "remote", "hybrid", "on site", "onsite", "relocation", "visa",
    "Warsaw", "Poland", "English", "slot", "live casino", "game",
]

for line in (out / "desc.ndjson").read_text().splitlines():
    if not line.strip():
        continue
    o = json.loads(line)
    body = o.get("body") or ""
    if len(body) < 300:
        print(f"!! THIN  {o.get('title')}  {o['url']}")
        continue
    hits = [
        t for t in dict.fromkeys(TERMS)
        if re.search(r"(?<![A-Za-z])" + re.escape(t) + r"(?![A-Za-z])", body, re.I)
    ]
    crit = o.get("criteria") or []
    loc = re.search(r"(work model|hiring location|location)[:\s].{0,120}", body, re.I)
    print(f"### {o.get('title')} | {o.get('company')}")
    print(f"    {o['url']}")
    print(f"    STACK: {', '.join(hits)}")
    print(f"    LOC:   {loc.group(0)[:130] if loc else '-'}")
    print(f"    LVL:   {'; '.join(c.replace('Seniority level ', '').replace('Employment type ', '') for c in crit[:2])}")
