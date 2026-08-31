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

Go builds the tool; `agent-browser` loads the pages and must be on PATH:

```bash
agent-browser --version || (npm install -g agent-browser && agent-browser install)
cd .claude/skills/job-sweep && go build -o jobsweep .
```

The binary is gitignored — build it, do not commit it. It is stdlib-only, so
the build needs no network.

Only public guest listings are used — no login, no LinkedIn account, nothing
behind the auth wall. Keep it that way. Do not connect the tool to Alexander's
signed-in Chrome profile to scrape more; automating a logged-in session is
against LinkedIn's terms, and the guest endpoints already return everything this
skill needs.

## The run

```bash
cd .claude/skills/job-sweep

./jobsweep sweep                   # ~7 min, run in background
./jobsweep score -mark-seen        # dedupe, rank, flag what is new
./jobsweep shortlist               # propose what earns a fetch -> shortlist.txt
#   read the proposal, trim shortlist.txt
./jobsweep fetch                   # ~2 min, run in background
./jobsweep summarize               # stack signals, not raw text
./jobsweep publish                 # the day's list -> content/jobs/<date>.json
```

Everything defaults to `runs/<today>`; pass `-out DIR` to work on another run.
`sweep` and `fetch` are slow and chatty — start them with `run_in_background`
and block on `until ! pgrep -f jobsweep; do sleep 10; done` rather than polling
by hand. `runs/` is gitignored; nothing from a run gets committed.

`publish` is the only command that writes outside `runs/`. `make jobs` in the
repository root does sweep, score and publish in one go and commits the result;
the page at `/cv/jobs/` is built from what was committed. Nothing is scheduled —
see `docs/adr/0006` for why the cron was abandoned.

`publish` applies the same drop rules as `shortlist` and no cap, and it writes
titles, companies, locations, links and scores — **never** description bodies.
Those are LinkedIn's text; the page links to a posting rather than reprinting
it.

`-mark-seen` records every URL in `runs/seen.json`, so the next run can flag
what is genuinely new. Pass it on a real weekly run; leave it off when
experimenting with queries, or the next run will think a backlog is old news.
`-new-only` prints just the new postings, which is usually what a week-two
run wants.

`queries.tsv` is the whole search strategy. Edit it rather than passing
arguments — a new city, a new stack, a new title all belong there. Keep it under
about fifteen lines; each one costs three page loads.

## Choosing what to fetch

`jobsweep shortlist` applies the rules below and writes a proposal. **It is a
proposal, not a verdict** — read it, cut what does not belong, then fetch. Score
`>= 5` is the default threshold and about 30 fetches is the right size: enough
to cover the real candidates, few enough to finish in two minutes.

The command already drops these, and you should not add them back:

- **AAA studios** — CD PROJEKT RED, Techland, 11 bit, Bloober. "Senior Game
  Programmer" in Warsaw is C++ engine work every time.
- **Mathematician, technical artist, producer, QA** roles that scored on the
  word *game*.
- Titles naming **Angular, Vue, React Native, Unity, .NET** as the primary stack.

And it force-includes these whatever the score, because the scorer
under-weights unusual spellings:

- Anything naming **Pixi, Phaser, Cocos, Babylon, WebGL, Spine, HTML5, Canvas** —
  the bullseye.
- Anything mentioning **video player, HLS, streaming** — the Exadel work is the
  one place that history is an asset rather than filler.

Add by hand: anything at a **known iGaming operator or supplier**, even with a
dull title. Company reputation is not something the regex list can keep current.

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

## The code

Go, stdlib only, one package. `go build -o jobsweep .` and `go vet ./...` are
the whole toolchain; keep it that way — a dependency here would have to be
worth the `go.sum`.

| | |
|---|---|
| `main.go` | Subcommand dispatch, and how the skill directory is located |
| `job.go` | The `Job` and `Desc` types, NDJSON helpers, rune-safe padding |
| `browser.go` | The entire agent-browser dependency, three functions wide |
| `sweep.go` | queries.tsv → guest search URLs → `raw.ndjson` |
| `score.go` | Weights, dedupe, `seen.json`, the ranked table |
| `shortlist.go` | The always-drop and always-fetch rules, as code |
| `fetch.go` | shortlist.txt → `desc.ndjson` |
| `summarize.go` | Descriptions → stack signals |
| `publish.go` | scored.json → content/jobs/&lt;date&gt;.json, the page's data |
| `js/` | The two in-browser extractors, embedded with `go:embed` |

Two things to know before editing:

- **Go's regexp is RE2 and has no lookaround.** Nothing here needs it —
  `\bjava\b` already declines to match "javascript", because there is no word
  boundary between "java" and the "s". Do not reach for a third-party engine.
- **Truncate by runes, never bytes.** Half the locations in a European job
  sweep are `Cracow, Małopolskie` or `Wrocław`; `pad` and `trunc` in `job.go`
  exist for this and the table columns should go through them.

Swapping the fetcher out — for a plain HTTP client, or a different browser
driver — means rewriting `browser.go` and nothing else.

## Publishing

The ranked sweep publishes itself: `jobsweep publish` writes the day's file and
`/cv/jobs/` renders it, with what is new since the last run flagged. That is the
harvest, and it needs nobody.

The **judged** shortlist is the part that does. Publish it as an artifact and
hand over the link; a list of twenty links is not delivered inside terminal
scrollback. Load `artifact-design` first. On a repeat run, update the existing
artifact by URL rather than creating a new one — find it with `action: "list"`
if the URL is not to hand, so the link Alexander has bookmarked keeps working.

Lead the terminal reply with the top five and the ruled-out summary. Do not
restate the whole page.
