---
name: job-sweep
description: Sweep LinkedIn for roles matching content/resume.json, read the descriptions, and publish a ranked shortlist. Use when Alexander asks to look for jobs, refresh the shortlist, check what is new this week, or search a different city or stack.
---

# Sweeping LinkedIn for roles

A weekly pass over public LinkedIn job listings, matched against
`content/resume.json`. It ends with a ranked, published shortlist and a list of
what was ruled out and why — so the same postings do not get re-litigated seven
days later.

The scripts do the harvesting. **You do the judging**, and the judging is most
of the value: a title and a company name cannot tell you that Push Gaming's
"Game Logic Server Developer" is Java, or that Aristocrat's throwaway
nice-to-have line is a four-for-four stack match.

## Before anything else

`agent-browser` must be on PATH:

```bash
agent-browser --version || npm install -g agent-browser && agent-browser install
```

Only public guest listings are used — no login, no LinkedIn account, nothing
behind the auth wall. Keep it that way. Do not connect the tool to Alexander's
signed-in Chrome profile to scrape more; automating a logged-in session is
against LinkedIn's terms, and the guest endpoints already return everything this
skill needs.

## The run

```bash
S=.claude/skills/job-sweep
OUT=$S/runs/$(date +%F)

$S/scripts/sweep.sh "$OUT"                          # ~7 min, run in background
python3 $S/scripts/score.py "$OUT" --mark-seen      # dedupe, rank, flag what is new
# pick the shortlist by hand -> $OUT/shortlist.txt (one URL per line)
$S/scripts/fetch-descriptions.sh "$OUT"             # ~2 min, run in background
python3 $S/scripts/summarize.py "$OUT"              # stack signals, not raw text
```

Both shell scripts are slow and chatty. Run them with `run_in_background`, then
block on `until ! pgrep -f sweep.sh; do sleep 10; done` rather than polling by
hand. `runs/` is gitignored; nothing from a run gets committed.

`--mark-seen` records every URL in `runs/seen.json`, so the next run can flag
what is genuinely new. Pass it on a real weekly run; leave it off when
experimenting with queries, or the next run will think a backlog is old news.
`--new-only` prints just the new postings, which is usually what a week-two
run wants.

`queries.tsv` is the whole search strategy. Edit it rather than passing
arguments — a new city, a new stack, a new title all belong there. Keep it under
about fifteen lines; each one costs three page loads.

## Choosing what to fetch

Score `>= 5` is roughly the fetch threshold, but read the titles before
committing. Fetch about 30 — enough to cover the real candidates, few enough to
finish in two minutes. Always drop, without spending a fetch:

- **AAA studios** — CD PROJEKT RED, Techland, 11 bit, Bloober. "Senior Game
  Programmer" in Warsaw is C++ engine work every time.
- **Mathematician, technical artist, producer, QA** roles that scored on the
  word *game*.
- Titles naming **Angular, Vue, React Native, Unity, .NET** as the primary stack.

Always fetch, whatever the score:

- Anything naming **Pixi, Phaser, Cocos, Babylon, WebGL, Spine, HTML5** — these
  are the bullseye and the scorer under-weights unusual spellings.
- Anything at a **known iGaming operator or supplier**, even with a dull title.
- Anything mentioning **video player, HLS, streaming** — the Exadel work is the
  one place that history is an asset rather than filler.

## Tiering what comes back

Three tiers, and the tier is decided by the description, never the score:

1. **Browser game clients on his stack.** The posting names HTML5/canvas game
   work in TypeScript or JavaScript. He would describe his experience, not
   translate it.
2. **Games or iGaming company, product-side frontend.** Domain vocabulary
   transfers, day job is product React. Lead with the Evolution regulatory,
   multi-skin and i18n work here.
3. **Senior product frontend, Warsaw or Poland-remote.** No games content, but
   right seniority, right location, walk-in stack. Often the better pay band —
   say so rather than treating it as consolation.

Within a tier, order by how much of the posting he has already done, and say
which prior job each match comes from. "Their nice-to-have section is your CV"
is a useful line because it is checkable, not because it is flattering.

## Rules for the write-up

- **Every claim traces to the fetched description.** Same evidence rule as
  [cv-prose](../cv-prose/SKILL.md): if the posting does not say it, do not
  write it. Do not infer salary, team size, or culture from a company name.
- **Name the caveat on the row it belongs to.** On-site in Sofia, three days in
  Kraków, Associate-level pay band, contract not employment, no visa
  sponsorship. A shortlist that hides these wastes his week.
- **Keep the ruled-out section.** Company, role, one-word reason (`Java`,
  `C++`, `Angular`). It is the part that saves time on the next run.
- **Report the shape of the market honestly.** If only two Warsaw game-client
  roles exist, say that plainly and offer the adjacent cities — Berlin, Malta,
  Cyprus, Barcelona — rather than padding the list to look productive.
- **Dates matter.** Postings close fast. Show the posting date on every row.

## Publishing

Publish the shortlist as an artifact and hand over the link; a list of twenty
links is not delivered inside terminal scrollback. Load `artifact-design`
first. On a repeat run, update the existing artifact by URL rather than
creating a new one — find it with `action: "list"` if the URL is not to hand,
so the link Alexander has bookmarked keeps working.

Lead the terminal reply with the top five and the ruled-out summary. Do not
restate the whole page.
