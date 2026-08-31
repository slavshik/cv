# The jobs list is a second page here, and its data is committed

Status: accepted

The `job-sweep` skill ends in a terminal table and an artifact link. Neither
survives the week: the table scrolls away and the artifact is a single snapshot
with no yesterday. What was wanted instead was a page — one list a day, with
what is new since the last sweep marked, and the earlier days still readable.

It is built here, at `/cv/jobs/`, out of `content/jobs/<date>.json`, one file
per sweep. Three alternatives were weighed and rejected:

- **its own repository.** ADR 0001 separated the CV from slavshik.me because
  the two shared nothing but a domain. This shares `content/resume.json` — the
  sweep is scored against it — and the palette, and would have meant keeping
  the skill in one repository and the page it feeds in another;
- **a Cloudflare Worker with the data in KV**, which is the only shape that
  would have made the list genuinely private. It was not worth a runtime, a
  second deploy path and an Access policy for a list of public job postings;
- **not publishing at all**, reading it on the laptop. It is read on a phone.

## What that costs, stated plainly

This repository is public, so the list is public and so is the commit history
of what was swept on which morning. The page is `noindex`, disallowed in
`public/robots.txt`, absent from `public/sitemap.xml` and linked from nowhere —
but obscurity is all that is, and anybody with the URL or the repository can
read it. Nothing that is not already public goes in: the rows are titles,
companies, locations and links to public LinkedIn postings. Fetched description
bodies are somebody else's text and are **never** published — `jobsweep
publish` writes a trimmed record and `desc.ndjson` stays in the gitignored
`runs/`.

## Consequences

- **The sweep is run by hand, and that was not the plan.** `make jobs` sweeps,
  publishes the day's file and commits it; pushing is a separate, deliberate
  act. There is no schedule of any kind.

    A launchd agent was built, installed and measured first. macOS protects
    `~/Documents`, `~/Desktop` and `~/Downloads` through TCC, and it grants that
    access per _responsible process_: a terminal holds the grant and everything it
    starts inherits it, which is why the sweep has always worked when a person ran
    it. A LaunchAgent is its own responsible process and holds nothing. Granting
    Full Disk Access to `/bin/sh` was not enough either — the grant does not cover
    the process tree. Measured from inside a LaunchAgent afterwards: `sh`,
    `/bin/cat`, `/bin/ls`, `/usr/bin/git` and `node` were allowed; the homebrew
    `go` was still refused, and on a later run hung instead of failing.

    Moving the repository out of `~/Documents` would have solved it, and so would
    granting access to each binary in the chain. Neither was worth a schedule for
    a list one person reads.

    Two things noted while establishing that, both untested claims this document
    used to state as fact. Whether LinkedIn serves its guest endpoints to a GitHub
    Actions runner has never been checked. And the sweep does not need a browser:
    the endpoint is a server-rendered HTML fragment that a bare `curl` fetches, so
    `browser.go` could be `net/http` and a run would take seconds instead of seven
    minutes — at the cost of an HTML parser, which the standard library does not
    have. Both are the first things to reach for if this ever wants a schedule
    again.

- **Only half the skill is automated.** `sweep` and `score` are deterministic.
  `shortlist` is a proposal a human trims, `fetch` spends page loads on that
  trimmed list, and the tiering is judgment. The page carries the ranked sweep;
  the judged shortlist is still a thing that happens when somebody runs one.
- **The CV's budget is the CV's.** `test/size.mjs` measures the assets
  `dist/index.html` references rather than everything in `dist/assets`, so the
  jobs stylesheet cannot spend the 12 kB. There is no screenshot baseline for
  this page: its content changes every morning and a baseline would be red by
  breakfast.
- **The palette moved to `src/tokens.css`**, imported by both pages. The build
  output was byte-identical after the move, which is what let it happen without
  retaking the baselines.
- **The "new" flag is machine state, not data.** `runs/seen.json` is what makes
  a posting new, and `runs/` is gitignored — clear it, or sweep from a second
  machine, and a whole morning reads as new. It could be derived instead from
  the published days: new is "this URL is in no earlier `content/jobs/*.json`".
  Worth doing the day the sweep moves anywhere.
- **`content/jobs/` grows by about 25 kB a day** and the page renders the last
  three weeks. Trimming it is a decision for whoever notices; nothing breaks
  when the directory is emptied, and the build works with no files there at all.
